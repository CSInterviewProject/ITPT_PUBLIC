// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.domain.admin.systemlog;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemLogWriter {

    private final SystemLogRepository systemLogRepository;

    @Async("systemLogExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeAsync(String level,
                           String service,
                           String eventType,
                           String message,
                           String traceId,
                           Long userId) {
        try {
            systemLogRepository.save(SystemLog.builder()
                    .level(level)
                    .service(service)
                    .eventType(eventType)
                    .message(message)
                    .traceId(traceId)
                    .userId(userId)
                    .count(1)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to persist system log. eventType={}", eventType, e);
        }
    }
}
