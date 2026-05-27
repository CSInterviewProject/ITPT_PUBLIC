// 파일 목적: dashboard summary response용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.dashboard.dto;

// 위치: src/main/java/com/itpt/api/domain/dashboard/dto/DashboardSummaryResponse.java
// 역할: 요청/응답 데이터 전송 객체(DTO) 정의


import lombok.Getter;

import java.util.List;

/**
 * DashboardSummaryResponse DTO 계약을 정의한다.
 * DTO는 대시보드 응답 스키마를 안정적으로 유지하고 내부 구조와 분리한다.
 * 내부 엔티티 구조에 결합되지 않게 한다.
 */
@Getter // getter 자동 생성(Lombok)
public class DashboardSummaryResponse {

    private final int averageScore;
    private final int totalAnswers;
    private final int level;
    private final List<TopicStat> topicStats;

    // 함수 목적: DashboardSummaryResponse를 생성한다.
    public DashboardSummaryResponse(int averageScore, int totalAnswers, int level, List<TopicStat> topicStats) {
        this.averageScore = averageScore;
        this.totalAnswers = totalAnswers;
        this.level = level;
        this.topicStats = topicStats;
    }

    @Getter // getter 자동 생성(Lombok)
    public static class TopicStat {
        private final String topic;
        private final int count;
        private final int averageScore;

        public TopicStat(String topic, int count, int averageScore) {
            this.topic = topic;
            this.count = count;
            this.averageScore = averageScore;
        }

    }
}
