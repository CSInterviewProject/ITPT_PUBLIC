// 파일 목적: admin record stats dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.admin.dto;

// 위치: src/main/java/com/itpt/api/domain/admin/dto/AdminRecordStatsDto.java
// 역할: 면접 기록 탭 상단 요약 카드용 DTO

import lombok.Getter;

/**
 * AdminRecordStatsDto DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
public class AdminRecordStatsDto {

    private final int totalSessions;  // 전체 세션 수
    private final int avgScore;       // 전체 평균 점수
    private final int todaySessions;  // 오늘 세션 수
    private final int bestScore;      // 최고 점수
    private final String bestScoreInfo; // "userName · topic"

    public AdminRecordStatsDto(int totalSessions, int avgScore, int todaySessions,
                               int bestScore, String bestScoreInfo) {
        this.totalSessions  = totalSessions;
        this.avgScore       = avgScore;
        this.todaySessions  = todaySessions;
        this.bestScore      = bestScore;
        this.bestScoreInfo  = bestScoreInfo;
    }
}
