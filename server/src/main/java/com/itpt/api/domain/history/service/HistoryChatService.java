// 파일 목적: history chat 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.history.service;

import com.itpt.api.ai.openai.OpenAiInterviewEvaluator;
import com.itpt.api.domain.history.dto.HistoryChatRequest;
import com.itpt.api.domain.history.dto.HistoryChatResponse;
import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserRepository;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import com.itpt.api.global.security.JwtAuthenticatedUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * HistoryChatService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Service
@Slf4j
public class HistoryChatService {

    private final HistoryChatReadService historyChatReadService;
    private final UserRepository userRepository;
    private final OpenAiInterviewEvaluator evaluator;

    public HistoryChatService(
            HistoryChatReadService historyChatReadService,
            UserRepository userRepository,
            OpenAiInterviewEvaluator evaluator
    ) {
        this.historyChatReadService = historyChatReadService;
        this.userRepository = userRepository;
        this.evaluator = evaluator;
    }

/**
 * 'chat' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public HistoryChatResponse chat(HistoryChatRequest request) {
        if (request == null || request.getAnswerId() == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST);
        }
        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new ApiException(ErrorCode.BAD_REQUEST);
        }

        Long currentUserId = getCurrentUserId();
        HistoryChatContext context = historyChatReadService.loadContext(request.getAnswerId(), currentUserId);

        String aiAnswer;
        try {
            aiAnswer = evaluator.answerQuestionAboutPastAnswer(
                    context.topic(),
                    context.questionText(),
                    context.modelAnswer(),
                    context.requiredKeywords(),
                    context.optionalKeywords(),
                    context.userAnswer(),
                    context.score(),
                    context.feedback(),
                    request.getQuestion()
            );
        } catch (Exception e) {
            log.warn("history chat fallback activated. answerId={}", request.getAnswerId(), e);
            aiAnswer = "현재 AI 응답이 지연되어 기본 코칭을 제공합니다. 답변을 정의-근거-예시 순서로 재구성해 보세요.";
        }

        return new HistoryChatResponse(context.answerId(), aiAnswer);
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
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }
}
