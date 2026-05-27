// 파일 목적: interview session 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.interview.service;

import com.itpt.api.domain.interview.dto.CreateSessionRequest;
import com.itpt.api.domain.interview.dto.CreateSessionResponse;
import com.itpt.api.domain.interview.dto.EndSessionResponse;
import com.itpt.api.domain.interview.dto.EvaluationDto;
import com.itpt.api.domain.interview.dto.InterviewTurnRequest;
import com.itpt.api.domain.interview.dto.InterviewTurnResponse;
import com.itpt.api.domain.interview.dto.NextQuestionDto;
import com.itpt.api.domain.interview.dto.SessionReportResponse;
import com.itpt.api.domain.interview.dto.SessionTurnItem;
import com.itpt.api.domain.interview.entity.InterviewSession;
import com.itpt.api.domain.interview.entity.InterviewTurn;
import com.itpt.api.domain.interview.repository.InterviewSessionRepository;
import com.itpt.api.domain.interview.repository.InterviewTurnRepository;
import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserRepository;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import com.itpt.api.global.security.JwtAuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * InterviewSessionService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewTurnRepository turnRepository;
    private final InterviewTurnPersistenceService turnPersistenceService;

    private final UserRepository userRepository;
    private final InterviewTurnService interviewTurnService;

/**
 * 'create session' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional
    public CreateSessionResponse createSession(CreateSessionRequest req) {
        if (req.getTopic() == null || req.getTopic().isBlank()) {
            throw new IllegalArgumentException("topic is required");
        }

        Long userId = getCurrentUserId();
        InterviewSession session = new InterviewSession(userId, req.getTopic());
        InterviewSession saved = sessionRepository.save(session);
        return new CreateSessionResponse(saved.getId(), saved.getTopic());
    }

    // 함수 목적: current user id를 반환한다.
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtAuthenticatedUser jwtUser && jwtUser.getUserId() != null) {
            return jwtUser.getUserId();
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        return user.getId();
    }

/**
 * 'create turn' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public InterviewTurnResponse createTurn(Long sessionId, InterviewTurnRequest req) {
        // DB 트랜잭션은 짧게 유지한다: 세션 상태를 검증하고, AI 작업은 트랜잭션 밖에서 수행한 뒤 저장한다.
        turnPersistenceService.ensureActiveSession(sessionId);

        InterviewTurnResponse result;
        try {
            result = interviewTurnService.processTurn(req);
        } catch (Exception e) {
            log.warn("createTurn fallback activated. sessionId={}", sessionId, e);
            result = buildFallbackTurnResponse(req);
        }

        turnPersistenceService.saveTurn(sessionId, req, result);
        return result;
    }

    // 함수 목적: fallback turn response를 구성한다.
    private InterviewTurnResponse buildFallbackTurnResponse(InterviewTurnRequest req) {
        EvaluationDto evaluation = new EvaluationDto(
                60,
                "AI 평가가 지연되어 기본 피드백을 반환했습니다. 핵심 개념 정의와 동작 과정을 단계적으로 보완해 보세요.",
                List.of(),
                List.of("핵심 주제 언급"),
                List.of("정의-원리-예시 구조로 답변 확장")
        );

        NextQuestionDto next = new NextQuestionDto(
                -1L,
                req.getTopic(),
                req.getDifficulty() == null ? 2 : Math.min(5, req.getDifficulty() + 1),
                "방금 답변한 개념의 동작 과정을 단계별로 설명해 주세요.",
                "정의 -> 내부 동작 -> 예시 순서로 답변을 구성해 주세요.",
                List.of(),
                List.of(),
                true
        );

        return new InterviewTurnResponse(evaluation, next);
    }

/**
 * 'end session' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional
    public EndSessionResponse endSession(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("session not found: " + sessionId));
        session.end();
        return new EndSessionResponse(session.getId(), session.getStatus().name());
    }

/**
 * 'report' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional(readOnly = true)
    public SessionReportResponse report(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("session not found: " + sessionId));

        List<InterviewTurn> turns = turnRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        int total = turns.size();
        double avg = turns.stream()
                .map(InterviewTurn::getScore)
                .filter(s -> s != null)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);

        List<SessionTurnItem> items = new ArrayList<>();
        for (InterviewTurn t : turns) {
            items.add(new SessionTurnItem(
                    t.getId(),
                    t.getQuestionId(),
                    t.getTranscript(),
                    t.getScore(),
                    t.getFeedback()
            ));
        }

        String summary = "세션 요약: 총 " + total + "문항을 진행했고, 평균 점수는 " + String.format("%.1f", avg) + "점입니다.";
        List<String> strengths = List.of("답변 로그가 저장됨", "세션 단위로 묶음");
        List<String> improvements = List.of("다음 단계에서 GPT-4.1-mini로 세션 리포트 생성");

        return new SessionReportResponse(
                session.getId(),
                session.getTopic(),
                total,
                avg,
                summary,
                strengths,
                improvements,
                items
        );
    }
}
