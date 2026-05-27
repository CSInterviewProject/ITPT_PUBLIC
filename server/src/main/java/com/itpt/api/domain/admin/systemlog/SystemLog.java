// 파일 목적: system log 도메인 엔티티 모델을 정의한다.
package com.itpt.api.domain.admin.systemlog;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 위치: src/main/java/com/itpt/api/domain/admin/systemlog/SystemLog.java
 * 역할: 관리자 시스템 로그 탭에 표시할 구조화 로그 엔티티
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "system_log")
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String level;

    @Column(nullable = false, length = 50)
    private String service;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "trace_id", length = 100)
    private String traceId;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private Integer count;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public SystemLog(String level, String service, String eventType, String message,
                     String traceId, Long userId, Integer count, LocalDateTime createdAt) {
        this.level = level;
        this.service = service;
        this.eventType = eventType;
        this.message = message;
        this.traceId = traceId;
        this.userId = userId;
        this.count = count;
        this.createdAt = createdAt;
    }
}
