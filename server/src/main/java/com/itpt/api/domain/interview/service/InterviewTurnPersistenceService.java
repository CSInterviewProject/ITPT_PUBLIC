// 파일 목적: interview turn persistence 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.interview.service;

import com.itpt.api.domain.interview.dto.InterviewTurnRequest;
import com.itpt.api.domain.interview.dto.InterviewTurnResponse;
import com.itpt.api.domain.interview.entity.InterviewSession;
import com.itpt.api.domain.interview.entity.InterviewTurn;
import com.itpt.api.domain.interview.repository.InterviewSessionRepository;
import com.itpt.api.domain.interview.repository.InterviewTurnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * InterviewTurnPersistenceService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Service
@RequiredArgsConstructor
public class InterviewTurnPersistenceService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewTurnRepository turnRepository;

/**
 * 'ensure active session' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional(readOnly = true)
    public void ensureActiveSession(Long sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("session not found: " + sessionId));

        if (session.getStatus() == InterviewSession.Status.ENDED) {
            throw new IllegalStateException("session already ended: " + sessionId);
        }
    }

/**
 * 'save turn' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional
    public void saveTurn(Long sessionId, InterviewTurnRequest req, InterviewTurnResponse result) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("session not found: " + sessionId));

        if (session.getStatus() == InterviewSession.Status.ENDED) {
            throw new IllegalStateException("session already ended: " + sessionId);
        }

        Integer score = result.getEvaluation() != null ? result.getEvaluation().getScore() : null;
        String feedback = result.getEvaluation() != null ? result.getEvaluation().getFeedback() : null;

        InterviewTurn turn = new InterviewTurn(
                session,
                req.getQuestionId(),
                req.getTopic(),
                req.getTranscript(),
                score,
                feedback
        );
        turnRepository.save(turn);
    }
}
