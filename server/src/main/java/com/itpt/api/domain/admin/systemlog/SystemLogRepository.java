// 파일 목적: system log의 영속성 접근 연산을 정의한다.
package com.itpt.api.domain.admin.systemlog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * system log queries용 영속성 추상화 계층이다.
 * 리포지토리는 로그 저장소의 조회/쿼리 연산을 중앙화한다.
 * 서비스 코드가 JPA 특화 조회 세부 구현에 의존하지 않게 한다.
 */
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    /**
     * 관리자 모니터링 화면용 최신 100개 로그를 반환한다.
     */
    List<SystemLog> findTop100ByOrderByCreatedAtDesc();
}
