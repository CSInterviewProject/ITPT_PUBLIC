// 파일 목적: answer 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.answer.service;

// 위치: src/main/java/com/itpt/api/domain/answer/service/AnswerService.java
// 역할: 비즈니스 로직을 처리하고 트랜잭션/저장을 조율

import com.itpt.api.domain.answer.dto.AnswerCreateRequest;
import com.itpt.api.domain.answer.dto.AnswerResponse;
import com.itpt.api.domain.answer.entity.Answer;
import com.itpt.api.domain.answer.repository.AnswerRepository;
import com.itpt.api.domain.question.entity.Question;
import com.itpt.api.domain.question.repository.QuestionRepository;
import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserRepository;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import com.itpt.api.global.security.JwtAuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

/**
 * 답변 생성과 최근 이력 조회를 담당하는 애플리케이션 서비스다.
 * 서비스는 검증, 현재 사용자 해석, 엔티티 로딩을 오케스트레이션하고
 * 컨트롤러는 얇게 유지하면서 영속화까지 수행한다.
 */
@Service
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    // 함수 목적: AnswerService를 생성한다.
    public AnswerService(AnswerRepository answerRepository, QuestionRepository questionRepository, UserRepository userRepository) {
        this.answerRepository = answerRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
    }

/**
 * 'create' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional
    public AnswerResponse create(AnswerCreateRequest req) {
        if (req == null) throw new ApiException(ErrorCode.BAD_REQUEST);
        if (req.getQuestionId() == null) throw new ApiException(ErrorCode.BAD_REQUEST);
        if (req.getUserAnswer() == null || req.getUserAnswer().isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);

        Long userId = getCurrentUserId();
        User user = userRepository.getReferenceById(userId);

        Question q = questionRepository.findById(req.getQuestionId())
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND));

        Answer a = new Answer();
        a.setUser(user);
        a.setQuestion(q);
        a.setTopic(req.getTopic() != null ? req.getTopic() : q.getTopic());
        a.setUserAnswer(req.getUserAnswer());
        a.setScore(req.getScore());
        a.setFeedback(req.getFeedback());

        Answer saved = answerRepository.save(a);

        return new AnswerResponse(
                saved.getId(),
                saved.getUser().getId(),
                saved.getQuestion().getId(),
                saved.getQuestion().getQuestionText(),
                saved.getTopic(),
                saved.getUserAnswer(),
                saved.getScore(),
                saved.getFeedback(),
                saved.getCreatedAt()
        );
    }

/**
 * 'recent for current user' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional(readOnly = true)
    public List<AnswerResponse> recentForCurrentUser(int limit) {
        Long userId = getCurrentUserId();
        List<Answer> list = answerRepository.findTop20ByUser_IdOrderByCreatedAtDesc(userId);

        // limit은 현재 Repository 메서드가 20 고정이라 방어적으로 slice만 적용
        int max = Math.max(0, Math.min(limit, list.size()));
        return list.subList(0, max).stream().map(a -> new AnswerResponse(
                a.getId(),
                userId,
                a.getQuestion().getId(),
                a.getQuestion().getQuestionText(),
                a.getTopic(),
                a.getUserAnswer(),
                a.getScore(),
                a.getFeedback(),
                a.getCreatedAt()
        )).toList();
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
