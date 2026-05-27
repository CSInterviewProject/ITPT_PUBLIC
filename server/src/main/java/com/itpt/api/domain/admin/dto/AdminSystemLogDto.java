// 파일 목적: admin system log dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.admin.dto;

import com.itpt.api.domain.admin.systemlog.SystemLog;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

/**
 * AdminSystemLogDto DTO 계약을 정의한다.
 * DTO는 관리자 로그 페이로드 형식을 안정적으로 노출하고 누수를 방지한다.
 * 영속 엔티티가 API 응답으로 직접 노출되지 않게 한다.
 */
@Getter
public class AdminSystemLogDto {

    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final Long id;
    private final String level;
    private final String service;
    private final String eventType;
    private final String message;
    private final String traceId;
    private final Long userId;
    private final Integer count;
    private final String createdAt;
    private final String time;

    public AdminSystemLogDto(Long id, String level, String service, String eventType,
                             String message, String traceId, Long userId, Integer count,
                             String createdAt, String time) {
        this.id = id;
        this.level = level;
        this.service = service;
        this.eventType = eventType;
        this.message = message;
        this.traceId = traceId;
        this.userId = userId;
        this.count = count;
        this.createdAt = createdAt;
        this.time = time;
    }

    // 함수 목적: from 로직을 구현한다.
    public static AdminSystemLogDto from(SystemLog log) {
        return new AdminSystemLogDto(
                log.getId(),
                log.getLevel(),
                log.getService(),
                log.getEventType(),
                log.getMessage(),
                log.getTraceId(),
                log.getUserId(),
                log.getCount(),
                log.getCreatedAt().format(DATETIME_FMT),
                log.getCreatedAt().format(TIME_FMT)
        );
    }
}
