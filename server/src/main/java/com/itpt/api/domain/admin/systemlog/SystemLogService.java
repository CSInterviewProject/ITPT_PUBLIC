// 파일 목적: system log 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.admin.systemlog;

import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 시스템 로그 쓰기/읽기 정책을 담당하는 애플리케이션 서비스다.
 * 서비스는 로깅 정책 결정(샘플링, 필터링,
 * 기능 플래그)을 캡슐화해 컨트롤러/핸들러가 의도 수준 이벤트만 발행하게 한다.
 */
@Service
@RequiredArgsConstructor
public class SystemLogService {

    private static final Set<String> AUTH_SUCCESS_EVENTS = Set.of(
            "SIGNUP_SUCCESS",
            "LOGIN_SUCCESS"
    );

    private static final Set<String> NOISY_EVENTS = Set.of(
            "USER_EMAIL_EXISTS",
            "INVALID_PASSWORD",
            "UNAUTHORIZED",
            "BAD_REQUEST",
            "ILLEGAL_ARGUMENT",
            "VALIDATION_ERROR",
            "MALFORMED_JSON"
    );

    private final SystemLogRepository systemLogRepository;
    private final SystemLogWriter systemLogWriter;

    @Value("${app.system-log.enabled:true}")
    private boolean systemLogEnabled;

    @Value("${app.system-log.auth-success-enabled:false}")
    private boolean authSuccessEnabled;

    @Value("${app.system-log.noisy-event-sample-rate:0.1}")
    private double noisyEventSampleRate;

    /**
     * 정책 검증 후 시스템 로그 이벤트를 비동기로 저장한다.
     */
    public void write(String level, String service, String eventType, String message, Long userId) {
        if (!systemLogEnabled) {
            return;
        }
        if (!authSuccessEnabled && AUTH_SUCCESS_EVENTS.contains(eventType)) {
            return;
        }
        if (NOISY_EVENTS.contains(eventType) && !acceptSample(noisyEventSampleRate)) {
            return;
        }

        String traceId = MDC.get("traceId");
        systemLogWriter.writeAsync(level, service, eventType, message, traceId, userId);
    }

    /**
     * 관리자 타임라인 화면용 최신 로그를 반환한다.
     */
    @Transactional(readOnly = true)
    public List<SystemLog> getRecent() {
        return systemLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    // 함수 목적: accept sample 로직을 구현한다.
    private boolean acceptSample(double sampleRate) {
        if (sampleRate >= 1.0d) {
            return true;
        }
        if (sampleRate <= 0.0d) {
            return false;
        }
        return ThreadLocalRandom.current().nextDouble() < sampleRate;
    }
}
