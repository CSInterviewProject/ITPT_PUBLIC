// 파일 목적: history chat read 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.history.service;

import com.itpt.api.domain.answer.entity.Answer;
import com.itpt.api.domain.answer.repository.AnswerRepository;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HistoryChatReadService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Service
@RequiredArgsConstructor
public class HistoryChatReadService {

    private final AnswerRepository answerRepository;

/**
 * 'load context' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional(readOnly = true)
    public HistoryChatContext loadContext(Long answerId, Long currentUserId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ApiException(ErrorCode.BAD_REQUEST));

        if (currentUserId == null || answer.getUser() == null || !answer.getUser().getId().equals(currentUserId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        String questionText = answer.getQuestion() != null ? answer.getQuestion().getQuestionText() : "";
        String modelAnswer = answer.getQuestion() != null ? answer.getQuestion().getModelAnswer() : "";

        return new HistoryChatContext(
                answer.getId(),
                answer.getTopic(),
                questionText,
                modelAnswer,
                answer.getQuestion() != null ? answer.getQuestion().getRequiredKeywords() : null,
                answer.getQuestion() != null ? answer.getQuestion().getOptionalKeywords() : null,
                answer.getUserAnswer(),
                answer.getScore(),
                answer.getFeedback()
        );
    }
}
