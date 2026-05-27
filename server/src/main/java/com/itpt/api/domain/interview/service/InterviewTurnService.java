// 파일 목적: interview turn 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.interview.service;

import com.itpt.api.ai.openai.InterviewEvaluationSchema;
import com.itpt.api.ai.openai.OpenAiInterviewEvaluator;
import com.itpt.api.domain.interview.dto.EvaluationDto;
import com.itpt.api.domain.interview.dto.FollowUpPackDto;
import com.itpt.api.domain.interview.dto.InterviewTurnRequest;
import com.itpt.api.domain.interview.dto.InterviewTurnResponse;
import com.itpt.api.domain.interview.dto.NextQuestionDto;
import com.itpt.api.domain.question.entity.Question;
import com.itpt.api.domain.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * InterviewTurnService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Service
@RequiredArgsConstructor
public class InterviewTurnService {

    private final QuestionRepository questionRepository;
    private final OpenAiInterviewEvaluator evaluator;

/**
 * 'process turn' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public InterviewTurnResponse processTurn(InterviewTurnRequest req) {

        // 0) 기본 검증
        if (req.getTopic() == null || req.getTopic().isBlank()) {
            throw new IllegalArgumentException("topic is required");
        }
        if (req.getTranscript() == null || req.getTranscript().trim().isEmpty()) {
            EvaluationDto ev = new EvaluationDto(
                    0,
                    "답변이 비어있습니다. 마이크 녹음 후 답변을 말해 주세요.",
                    List.of(),
                    List.of(),
                    List.of("마이크 권한/녹음 상태 확인", "최소 3~5문장으로 답변")
            );

            // ✅ “재답변 유도 질문”도 pack 생성 가능(원하면)
            FollowUpPackDto pack = evaluator.generateFollowUpPack(
                    req.getTopic(),
                    "지금 질문에 대해 다시 한 번, 정의→근거→예시 순서로 답변해보세요.",
                    1
            );

            NextQuestionDto next = new NextQuestionDto(
                    -1L, // 생성형 질문임을 명시(프론트/백에서 구분하기 쉬움)
                    req.getTopic(),
                    1,
                    "지금 질문에 대해 다시 한 번, 정의→근거→예시 순서로 답변해보세요.",
                    pack.modelAnswer(),
                    safeList(pack.requiredKeywords()),
                    safeList(pack.optionalKeywords()),
                    true
            );
            return new InterviewTurnResponse(ev, next);
        }

        // 1) 질문 컨텍스트 확보
        String questionText;
        String modelAnswer;
        List<String> required;
        List<String> optional;
        int difficulty = req.getDifficulty() != null ? req.getDifficulty() : 2;

        boolean isDbQuestion = req.getQuestionId() != null && req.getQuestionId() > 0;

        if (isDbQuestion) {
            Long questionId = req.getQuestionId();
            Question q = questionRepository.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("question not found: " + req.getQuestionId()));

            questionText = q.getQuestionText();
            modelAnswer = q.getModelAnswer();
            required = safeList(questionRepository.findRequiredKeywordsByQuestionId(questionId));
            optional = safeList(questionRepository.findOptionalKeywordsByQuestionId(questionId));
            difficulty = q.getDifficulty();
        } else {
            // 생성형(꼬리질문)인 경우: 최소 questionText는 있어야 평가 가능
            if (req.getQuestionText() == null || req.getQuestionText().isBlank()) {
                throw new IllegalArgumentException("questionText is required when questionId is null/negative");
            }
            questionText = req.getQuestionText();

            // ✅ 프론트가 modelAnswer/keywords를 못 보내도 서버가 “없는 값”으로 평가 진행 가능하도록 보정
            modelAnswer = req.getModelAnswer() != null ? req.getModelAnswer() : "";
            required = safeList(req.getRequiredKeywords());
            optional = safeList(req.getOptionalKeywords());

            // (선택) 생성형 질문인데 키워드/모범답안이 비어있으면 서버에서 보충 생성도 가능
            // if (modelAnswer.isBlank() && required.isEmpty() && optional.isEmpty()) {
            //     FollowUpPackDto pack = evaluator.generateFollowUpPack(req.getTopic(), questionText, difficulty);
            //     modelAnswer = pack.modelAnswer();
            //     required = safeList(pack.requiredKeywords());
            //     optional = safeList(pack.optionalKeywords());
            // }
        }

        // 2) GPT 평가
        InterviewEvaluationSchema.Result r = evaluator.evaluateTurn(
                req.getTopic(),
                questionText,
                modelAnswer,
                required,
                optional,
                req.getTranscript()
        );

        // 3) missingKeywords 계산
        List<String> missing = computeMissingKeywords(required, req.getTranscript());

        // 4) EvaluationDto 생성
        EvaluationDto evaluation = new EvaluationDto(
                clampScore(r.score()),
                r.feedback(),
                missing,
                safeList(r.strengths()),
                safeList(r.improvements())
        );

        // 5) 다음 질문 텍스트
        String followUpQ = (r.followUpQuestion() == null) ? "" : r.followUpQuestion().trim();
        if (followUpQ.isBlank()) {
            // followUpQuestion이 비어있으면 안전하게 “동일 질문 재답변 유도”로 폴백
            followUpQ = "방금 질문을 다시 한 번, 핵심 정의→근거→예시 순서로 정리해서 답변해보세요.";
        }

        // ✅ 6) 다음 질문에 대한 “모범답안/키워드” 생성
        FollowUpPackDto pack = evaluator.generateFollowUpPack(
                req.getTopic(),
                followUpQ,
                Math.min(5, difficulty + 1)
        );

        // ✅ 7) NextQuestionDto에 채워서 반환
        NextQuestionDto next = new NextQuestionDto(
                -1L, // 생성형 꼬리질문
                req.getTopic(),
                Math.min(5, difficulty + 1),
                followUpQ,
                pack.modelAnswer(),
                safeList(pack.requiredKeywords()),
                safeList(pack.optionalKeywords()),
                true
        );

        return new InterviewTurnResponse(evaluation, next);
    }

    // 함수 목적: clamp score 로직을 구현한다.
    private int clampScore(int s) {
        if (s < 0) return 0;
        if (s > 100) return 100;
        return s;
    }

    // 함수 목적: safe list 로직을 구현한다.
    private List<String> safeList(List<String> list) {
        return list == null ? Collections.emptyList() : list;
    }

    // 함수 목적: compute missing keywords 로직을 구현한다.
    private List<String> computeMissingKeywords(List<String> requiredKeywords, String transcript) {
        if (requiredKeywords == null || requiredKeywords.isEmpty()) return List.of();
        if (transcript == null) transcript = "";

        String t = normalize(transcript);

        List<String> missing = new ArrayList<>();
        for (String kw : requiredKeywords) {
            if (kw == null || kw.isBlank()) continue;
            String k = normalize(kw);
            if (!t.contains(k)) missing.add(kw);
        }
        return missing;
    }

    // 함수 목적: input values를 정규화한다.
    private String normalize(String s) {
        return s.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }
}
