// 파일 목적: dashboard 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.dashboard.controller;

// 위치: src/main/java/com/itpt/api/domain/dashboard/controller/DashboardController.java
// 역할: HTTP 요청을 받아 서비스로 위임하고 응답을 반환

import com.itpt.api.domain.answer.entity.Answer;
import com.itpt.api.domain.answer.repository.AnswerRepository;
import com.itpt.api.domain.dashboard.dto.DashboardSummaryResponse;
import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserRepository;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 대시보드 요약 조회의 HTTP API 진입점이다.
 * 컨트롤러는 인증 사용자 요청을 서비스/리포지토리 호출로 변환한다.
 * 그리고 응답 DTO를 반환한다.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;

    // 함수 목적: DashboardController를 생성한다.
    public DashboardController(AnswerRepository answerRepository, UserRepository userRepository) {
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
    }

    /**
     * 대시보드 상단 수치 + 과목별 집계
     * GET /api/dashboard/summary
     */
    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        Long userId = getCurrentUserId();
        List<Answer> answers = answerRepository.findAllByUser_Id(userId);

        int total = answers.size();
        int avgScore = (total == 0) ? 0 :
                (int) Math.round(answers.stream().mapToInt(a -> a.getScore() == null ? 0 : a.getScore()).average().orElse(0));

        // 레벨 예시 규칙: 답변 3개당 1레벨 (최소 1)
        int level = Math.max(1, (total / 3) + 1);

        // topic별 count, 평균점수
        Map<String, List<Answer>> byTopic = answers.stream()
                .filter(a -> a.getTopic() != null && !a.getTopic().isBlank())
                .collect(Collectors.groupingBy(Answer::getTopic));

        List<DashboardSummaryResponse.TopicStat> topicStats = new ArrayList<>();
        for (Map.Entry<String, List<Answer>> e : byTopic.entrySet()) {
            String topic = e.getKey();
            List<Answer> list = e.getValue();
            int count = list.size();
            int topicAvg = (count == 0) ? 0 :
                    (int) Math.round(list.stream().mapToInt(a -> a.getScore() == null ? 0 : a.getScore()).average().orElse(0));
            topicStats.add(new DashboardSummaryResponse.TopicStat(topic, count, topicAvg));
        }

        // 보기 좋게 정렬(답변 많은 순)
        topicStats.sort(Comparator.comparingInt(DashboardSummaryResponse.TopicStat::getCount).reversed());

        return new DashboardSummaryResponse(avgScore, total, level, topicStats);
    }

    // 함수 목적: current user id를 반환한다.
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        return user.getId();
    }
}
