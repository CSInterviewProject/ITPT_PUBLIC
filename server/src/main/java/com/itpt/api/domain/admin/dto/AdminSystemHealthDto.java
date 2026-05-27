// 파일 목적: admin system health dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.admin.dto;

// 위치: src/main/java/com/itpt/api/domain/admin/dto/AdminSystemHealthDto.java
// 역할: 시스템 운영 탭 서비스 상태 카드 응답 DTO

import lombok.Getter;
import java.util.List;

/**
 * AdminSystemHealthDto DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
public class AdminSystemHealthDto {

    private final List<ServiceStatus> services;
    private final String checkedAt; // ISO datetime

    // 함수 목적: AdminSystemHealthDto를 생성한다.
    public AdminSystemHealthDto(List<ServiceStatus> services, String checkedAt) {
        this.services  = services;
        this.checkedAt = checkedAt;
    }

    @Getter
    public static class ServiceStatus {
        private final String name;
        private final String status;  // "ok" | "warn" | "error"
        private final String latency; // 예: "42ms", "1.2s"
        private final String rate;    // 성공률 예: "99.8%"

        public ServiceStatus(String name, String status, String latency, String rate) {
            this.name    = name;
            this.status  = status;
            this.latency = latency;
            this.rate    = rate;
        }
    }
}
