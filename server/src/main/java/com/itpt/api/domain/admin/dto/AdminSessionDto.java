// 파일 목적: admin session dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.admin.dto;

// 위치: src/main/java/com/itpt/api/domain/admin/dto/AdminSessionDto.java
// 역할: 관리자 면접 기록 목록 응답 DTO (세션 단위)

import lombok.Getter;

/**
 * AdminSessionDto DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
public class AdminSessionDto {

    private final Long sessionId;
    private final Long userId;
    private final String userName;
    private final String topic;
    private final int turnCount;
    private final int avgScore;
    private final String status;   // "ACTIVE" | "ENDED"
    private final String startedAt; // "yyyy-MM-dd HH:mm"

    public AdminSessionDto(Long sessionId, Long userId, String userName, String topic,
                           int turnCount, int avgScore, String status, String startedAt) {
        this.sessionId = sessionId;
        this.userId    = userId;
        this.userName  = userName;
        this.topic     = topic;
        this.turnCount = turnCount;
        this.avgScore  = avgScore;
        this.status    = status;
        this.startedAt = startedAt;
    }
}
