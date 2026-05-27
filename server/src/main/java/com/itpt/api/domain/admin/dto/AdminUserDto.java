// 파일 목적: admin user dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.admin.dto;

// 위치: src/main/java/com/itpt/api/domain/admin/dto/AdminUserDto.java
// 역할: 관리자 회원 목록/상세 응답 DTO (토픽별 통계 + 취약 토픽 포함)

import lombok.Getter;

import java.util.List;

/**
 * AdminUserDto DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
public class AdminUserDto {

    private final Long id;
    private final String name;
    private final String email;
    private final String role;
    private final String provider;      // "LOCAL" | "GOOGLE" | "KAKAO" | "NAVER"
    private final String status;        // "ACTIVE" | "INACTIVE"
    private final String createdAt;     // "yyyy-MM-dd" 포맷
    private final int answerCount;
    private final int avgScore;
    private final List<TopicStat> topicStats;
    private final List<String> weakTopics; // 평균 70점 미만인 토픽명 목록

    public AdminUserDto(Long id, String name, String email, String role,
                        String provider, String status, String createdAt,
                        int answerCount, int avgScore,
                        List<TopicStat> topicStats, List<String> weakTopics) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.provider = provider == null ? "LOCAL" : provider;
        this.status = status;
        this.createdAt = createdAt;
        this.answerCount = answerCount;
        this.avgScore = avgScore;
        this.topicStats = topicStats;
        this.weakTopics = weakTopics;
    }

    @Getter
    public static class TopicStat {
        private final String topic;
        private final int count;
        private final int avgScore;

        public TopicStat(String topic, int count, int avgScore) {
            this.topic = topic;
            this.count = count;
            this.avgScore = avgScore;
        }
    }
}