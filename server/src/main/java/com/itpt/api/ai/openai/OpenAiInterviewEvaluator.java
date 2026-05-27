// 위치: com/itpt/api/ai/openai/OpenAiInterviewEvaluator.java
// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.ai.openai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itpt.api.domain.interview.dto.FollowUpPackDto;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 파일: com/itpt/api/ai/openai/OpenAiInterviewEvaluator.java
 * 역할: AI(OpenAI) 연동 계층. 답변 평가/피드백/꼬리질문 생성.
 * 연결/흐름: Service → OpenAI Client(이 파일/패키지) → OpenAI API → 평가 결과 DTO 반환
 */
@Service
public class OpenAiInterviewEvaluator {

    private final OpenAiProperties props;
    private final OpenAiResponsesClient client;
    private final ObjectMapper om;

    // 함수 목적: OpenAiInterviewEvaluator를 생성한다.
    public OpenAiInterviewEvaluator(OpenAiProperties props, OpenAiResponsesClient client, ObjectMapper om) {
        this.props = props;
        this.client = client;
        this.om = om;
    }

    public InterviewEvaluationSchema.Result evaluateTurn(
            String topic,
            String questionText,
            String modelAnswer,
            List<String> requiredKeywords,
            List<String> optionalKeywords,
            String transcript
    ) {
        if (isMockEnabled()) {
            return mockEvaluateTurn(requiredKeywords, transcript);
        }

        String instructions = """
        너는 CS 면접관이다.
        사용자의 답변(transcript)을 평가하여 점수/피드백/누락키워드/꼬리질문을 생성한다.

        ─────────────────────────────────────────
        [모른다는 답변 처리 규칙] ★ 최우선 적용
        ─────────────────────────────────────────
        transcript가 아래 패턴 중 하나에 해당하는 경우:
          - "모르겠습니다", "잘 모르겠습니다", "모르겠어요", "모르겠는데요",
            "잘 모르겠어요", "모르겠다", "잘 모르겠다", "모르겠는데",
            "떠오르지 않습니다", "생각이 안 납니다", "기억이 안 납니다",
            그 외 사실상 '모른다'는 의미를 담고 있는 짧은 답변

        → 이 경우 반드시 아래 규칙을 따른다:
          * score: 0 으로 고정
          * feedback: "답변을 하지 못했습니다. 해당 개념을 다시 학습한 후 도전해보세요."
          * missingKeywords: requiredKeywords 전체
          * followUpQuestion: "" (빈 문자열로 고정 — 절대 꼬리질문을 생성하지 않는다)
          * strengths: []
          * improvements: requiredKeywords 전체를 개념 학습 항목으로 제안

        위 조건에 해당하면 아래 채점 기준은 적용하지 않는다.

        ─────────────────────────────────────────
        [점수 부여 가이드] (중요)
        ─────────────────────────────────────────
        - 전체적으로 70~85점 사이는 비교적 관대하게 부여한다.
        - 100점은 매우 엄격하게 심사한다(최상급 답변에서만 100 가능).

        점수 구간 정의:
        - 0~20점: 아예 대답을 못했거나("모르겠습니다" 등), 질문과 전혀 상관없는 동문서답인 경우.
        - 21~29점: 질문의 주제는 인식했으나 핵심 개념이 완전히 틀리거나 단 1~2 단어 수준의 파편적 답변.
        - 30~60점: 핵심 개념을 심각하게 오해하고 있거나, 필수 키워드가 대부분 누락된 경우.
        - 70~85점: 설명 구조가 조금 부족하더라도 질문의 핵심을 어느 정도 이해했고,
                   필수 키워드를 '일부' 포함한 경우. (기본적으로 이 점수대에 많이 분포하도록 채점)
        - 86~95점: 필수 키워드를 대부분 포함하고, 개념을 정확히 설명한 좋은 답변.
        - 96~100점: 필수 키워드를 모두 포함하고, 선택 키워드도 일부 포함하며,
                    설명 구조(정의→근거/과정→예시/비교→결론)가 매우 탄탄한 최고의 답변.
                    단, 100점은 거의 흠이 없을 때만 부여한다.

        ─────────────────────────────────────────
        [필수 키워드 판정 규칙] (중요)
        ─────────────────────────────────────────
        - requiredKeywords를 N개라고 할 때, 키워드 포함 정도를 '비율'로 판단하라.
          * 70~85점: 대략 N의 40%~70% 수준이 충족되면 가능 (핵심 개념 오해가 없어야 함).
          * 86~95점: 대략 N의 70% 이상 충족.
          * 96~100점: N의 거의 전부(또는 전부) 충족.
        - 키워드는 '동의어/유사 표현/설명으로 의미가 충족'되면 포함된 것으로 간주하라.
          (정확히 같은 단어가 아니어도 된다)

        ─────────────────────────────────────────
        [감점 캡] (중요)
        ─────────────────────────────────────────
        - 핵심 개념이 전반적으로 맞고 질문에 대한 답을 하고 있다면,
          설명 구조가 다소 부족하거나 키워드 일부 누락이 있어도 70점 아래로 내리지 마라.
        - 단, 개념 자체가 틀리거나 질문과 무관하면 0~60점대로 강하게 감점한다.

        ─────────────────────────────────────────
        [꼬리질문 생성 규칙]
        ─────────────────────────────────────────
        - score가 86점 이상인 경우: 답변의 "심화/확장" 방향으로 꼬리질문을 생성한다.
          (약점을 찌르기보다는 더 깊은 이해를 탐구하는 방향)
        - score가 70~85점인 경우: 답변에서 누락되거나 얕게 다룬 부분을 짚는 꼬리질문을 생성한다.
        - score가 69점 이하인 경우: 가장 핵심적인 개념 하나를 다시 물어보는 꼬리질문을 생성한다.
        - followUpQuestion은 반드시 1개만 생성한다.

        ─────────────────────────────────────────
        [평가 기준]
        ─────────────────────────────────────────
        - 정확성(개념/용어)
        - 필수 키워드 포함(requiredKeywords)
        - 설명 구조(정의 → 근거/과정 → 예시/비교 → 결론)
        - 선택 키워드(optionalKeywords)는 가점 요소

        ─────────────────────────────────────────
        [출력 규칙]
        ─────────────────────────────────────────
        - missingKeywords에는 requiredKeywords 중 transcript에서 '명시적으로 언급되지 않았거나'
          '설명으로도 의미 충족이 되지 않은' 것만 넣어라.
          (동의어/유사표현/설명으로 충족되면 missing으로 잡지 마라)
        - 출력은 반드시 JSON 스키마를 따른다(추가 필드 금지).
        """;

        String userMsg = """
        [TOPIC]
        %s

        [QUESTION]
        %s

        [MODEL_ANSWER]
        %s

        [REQUIRED_KEYWORDS]
        %s

        [OPTIONAL_KEYWORDS]
        %s

        [TRANSCRIPT]
        %s
        """.formatted(
                safeStr(topic),
                safeStr(questionText),
                modelAnswer == null ? "" : modelAnswer,
                requiredKeywords == null ? List.of() : requiredKeywords,
                optionalKeywords == null ? List.of() : optionalKeywords,
                transcript == null ? "" : transcript
        );

        List<Map<String, Object>> input = List.of(
                Map.of("role", "user", "content", userMsg)
        );

        String rawJson = client.createJsonResponse(
                resolveModel(),
                instructions,
                input,
                InterviewEvaluationSchema.JSON_SCHEMA
        );

        try {
            InterviewEvaluationSchema.Result parsed =
                    om.readValue(rawJson, InterviewEvaluationSchema.Result.class);

            return new InterviewEvaluationSchema.Result(
                    clampScore(parsed.score()),
                    safeStr(parsed.feedback()),
                    parsed.missingKeywords() == null ? Collections.emptyList() : parsed.missingKeywords(),
                    safeStr(parsed.followUpQuestion()),   // "" 이면 호출부에서 새 질문으로 분기
                    parsed.strengths() == null ? Collections.emptyList() : parsed.strengths(),
                    parsed.improvements() == null ? Collections.emptyList() : parsed.improvements()
            );
        } catch (Exception e) {
            return new InterviewEvaluationSchema.Result(
                    70,
                    "피드백 생성에 실패했습니다. 답변에서 핵심 개념/키워드를 더 명확히 설명해보세요.",
                    Collections.emptyList(),
                    "답변에서 말한 핵심 개념의 동작 과정을 단계별로 설명해보세요.",
                    List.of("기본 개념 언급"),
                    List.of("정확한 용어/근거 보강", "예시 추가")
            );
        }
    }

    // 함수 목적: follow up pack를 생성한다.
    public FollowUpPackDto generateFollowUpPack(String topic, String followUpQuestion, int difficulty) {
        if (isMockEnabled()) {
            return new FollowUpPackDto(
                    "정의 -> 원리 -> 예시 순서로 답변을 구성하세요.",
                    List.of("핵심정의", "동작원리"),
                    List.of("예시", "트레이드오프")
            );
        }

        String instructions = """
        너는 CS 면접관이며, 다음 "꼬리질문"에 대한 학습용 패키지를 만든다.

        ─────────────────────────────────────────
        [난이도(difficulty) 반영 규칙] ★ 필수 적용
        ─────────────────────────────────────────
        difficulty는 1~5 사이의 정수이며, 아래 기준에 따라 패키지의 깊이와 수준을 조정한다:

        - difficulty 1 (입문):
          * modelAnswer: 핵심 정의와 한 줄 설명 수준. 전문 용어 최소화.
          * requiredKeywords: 4~5개, 가장 기본적인 개념 위주.
          * optionalKeywords: 3개 이하, 간단한 연관 개념.

        - difficulty 2 (기초):
          * modelAnswer: 정의 + 핵심 동작 방식 정도. 쉬운 예시 포함 가능.
          * requiredKeywords: 5~6개, 기본 개념 + 주요 특징.
          * optionalKeywords: 3~4개.

        - difficulty 3 (중급):
          * modelAnswer: 정의 → 동작 과정 → 간단한 예시/비교 구조. 보통 면접 수준.
          * requiredKeywords: 6~7개, 동작 원리/특징/비교 키워드 포함.
          * optionalKeywords: 4~5개, 엣지 케이스나 연관 개념.

        - difficulty 4 (고급):
          * modelAnswer: 정의 → 내부 동작 → 예외/트레이드오프 → 실무 관련성까지 포함.
          * requiredKeywords: 7~8개, 심화 기술 용어 포함.
          * optionalKeywords: 5~6개, 성능/최적화/대안 기술 키워드.

        - difficulty 5 (심화):
          * modelAnswer: 내부 구현 원리, 트레이드오프, 실무 사례, 대안 비교까지 포함한 심층 답변.
          * requiredKeywords: 8개, 전문 기술 용어 및 원리 위주.
          * optionalKeywords: 6개, 고급 주제 / 논문 수준 개념 포함 가능.

        ─────────────────────────────────────────
        [공통 규칙]
        ─────────────────────────────────────────
        - topic과 followUpQuestion에만 기반해서 작성한다.
        - 키워드는 가능한 한 "명사형/기술용어"로 간결하게.
        - requiredKeywords는 서로 중복되지 않게.
        - 출력은 반드시 JSON 스키마만(추가 필드 금지).
        """;

        String userMsg = """
        [TOPIC]
        %s

        [DIFFICULTY]
        %d

        [FOLLOW_UP_QUESTION]
        %s
        """.formatted(
                safeStr(topic),
                difficulty,
                safeStr(followUpQuestion)
        );

        List<Map<String, Object>> input = List.of(
                Map.of("role", "user", "content", userMsg)
        );

        String rawJson = client.createJsonResponse(
                resolveModel(),
                instructions,
                input,
                FollowUpPackSchema.JSON_SCHEMA
        );

        try {
            FollowUpPackSchema.Result parsed =
                    om.readValue(rawJson, FollowUpPackSchema.Result.class);

            String modelAnswer = safeStr(parsed.modelAnswer());
            List<String> req = parsed.requiredKeywords() == null ? Collections.emptyList() : parsed.requiredKeywords();
            List<String> opt = parsed.optionalKeywords() == null ? Collections.emptyList() : parsed.optionalKeywords();

            if (modelAnswer.isBlank()) {
                modelAnswer = "해당 꼬리질문에 대해 정의→근거/과정→예시 순서로 핵심을 정리해 답변하세요.";
            }

            return new FollowUpPackDto(modelAnswer, req, opt);
        } catch (Exception e) {
            return new FollowUpPackDto(
                    "해당 질문의 핵심 개념을 정의하고, 동작 과정/특징을 설명한 뒤, 예시나 비교를 들어 마무리하세요.",
                    List.of(),
                    List.of()
            );
        }
    }



    public String answerQuestionAboutPastAnswer(
            String topic,
            String questionText,
            String modelAnswer,
            List<String> requiredKeywords,
            List<String> optionalKeywords,
            String userAnswer,
            Integer score,
            String feedback,
            String userQuestion
    ) {
        if (isMockEnabled()) {
            return "MOCK 답변입니다. 기존 답변을 정의-근거-예시 순서로 보완해 보세요.";
        }

        String instructions = """
        너는 학습 기록 페이지 전용 CS 코치 챗봇이다.
        반드시 제공된 기록만을 우선 근거로 설명하고, 부족한 정보는 추론이라고 명확히 밝혀라.

        [답변 규칙]
        - 항상 한국어로 답한다.
        - 사용자의 과거 답변을 존중하되, 틀린 부분은 분명하게 바로잡는다.
        - 질문이 감점 이유를 묻는 경우: 감점 원인 → 빠진 개념 → 어떻게 보완할지 순서로 답한다.
        - 질문이 더 좋은 답변 예시를 묻는 경우: 1) 핵심 포인트 2) 개선 답변 예시 순서로 답한다.
        - 질문이 개념 설명을 묻는 경우: 정의 → 핵심 원리 → 현재 기록과 연결해서 설명한다.
        - 답변은 너무 장황하지 않게, 하지만 실제 학습에 도움이 되도록 구체적으로 작성한다.
        - 기록에 없는 사실을 단정하지 말고, 필요한 경우 \"이 기록만으로 보면\" 이라고 표현한다.
        - 출력은 반드시 JSON 스키마를 따른다.
        """;

        String userMsg = """
        [TOPIC]
        %s

        [QUESTION_TEXT]
        %s

        [MODEL_ANSWER]
        %s

        [REQUIRED_KEYWORDS]
        %s

        [OPTIONAL_KEYWORDS]
        %s

        [USER_ANSWER]
        %s

        [SCORE]
        %s

        [EXISTING_FEEDBACK]
        %s

        [USER_QUESTION]
        %s
        """.formatted(
                safeStr(topic),
                safeStr(questionText),
                safeStr(modelAnswer),
                requiredKeywords == null ? List.of() : requiredKeywords,
                optionalKeywords == null ? List.of() : optionalKeywords,
                safeStr(userAnswer),
                score == null ? "" : String.valueOf(score),
                safeStr(feedback),
                safeStr(userQuestion)
        );

        List<Map<String, Object>> input = List.of(
                Map.of("role", "user", "content", userMsg)
        );

        try {
            String rawJson = client.createJsonResponse(
                    resolveModel(),
                    instructions,
                    input,
                    HistoryAnswerChatSchema.JSON_SCHEMA
            );

            HistoryAnswerChatSchema.Result parsed =
                    om.readValue(rawJson, HistoryAnswerChatSchema.Result.class);

            String answer = safeStr(parsed.answer()).trim();
            if (!answer.isBlank()) {
                return answer;
            }
        } catch (Exception ignored) {
        }

        return "이 기록 기준으로 보면 답변의 핵심 개념과 누락 포인트를 다시 정리해보는 것이 좋습니다. "
                + "질문한 내용이 감점 이유라면 필수 키워드 포함 여부와 설명 구조를 먼저 점검하세요.";
    }

    /**
     * followUpQuestion이 빈 문자열("")이면 사용자가 모른다는 답변을 한 것이므로,
     * 호출부(Service)에서 꼬리질문 대신 새로운 질문을 출제해야 한다.
     */
    public boolean isSkipFollowUp(String followUpQuestion) {
        return followUpQuestion == null || followUpQuestion.isBlank();
    }

    // 함수 목적: resolve model 로직을 구현한다.
    private String resolveModel() {
        return (props.model() == null || props.model().isBlank()) ? "gpt-4.1-mini" : props.model();
    }

    // 함수 목적: clamp score 로직을 구현한다.
    private int clampScore(int s) {
        if (s < 0) return 0;
        if (s > 100) return 100;
        return s;
    }

    // 함수 목적: safe str 로직을 구현한다.
    private String safeStr(String s) {
        return s == null ? "" : s;
    }

    // 함수 목적: mock enabled 여부를 확인한다.
    private boolean isMockEnabled() {
        return Boolean.TRUE.equals(props.mockEnabled());
    }

    // 함수 목적: mock evaluate turn 로직을 구현한다.
    private InterviewEvaluationSchema.Result mockEvaluateTurn(List<String> requiredKeywords, String transcript) {
        List<String> req = requiredKeywords == null ? List.of() : requiredKeywords;
        String t = transcript == null ? "" : transcript.toLowerCase();
        int score = t.isBlank() ? 0 : 78;
        return new InterviewEvaluationSchema.Result(
                score,
                "MOCK 평가 결과입니다. 핵심 개념은 언급했지만 근거와 예시를 보강해 보세요.",
                req.isEmpty() ? List.of() : List.of(req.get(0)),
                "방금 답변의 핵심 원리를 한 단계 더 자세히 설명해 주세요.",
                List.of("핵심 주제 언급"),
                List.of("정의-원리-예시 구조 강화")
        );
    }
}
