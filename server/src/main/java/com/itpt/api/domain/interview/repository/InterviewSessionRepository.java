// 파일 목적: interview session의 영속성 접근 연산을 정의한다.
package com.itpt.api.domain.interview.repository;

// 위치: src/main/java/com/itpt/api/domain/interview/repository/InterviewSessionRepository.java

import com.itpt.api.domain.interview.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * InterviewSessionRepository용 영속성 추상화 계층이다.
 * 리포지토리는 데이터 접근/조회 로직을 중앙화하고
 * 상위 계층을 JPA/SQL 세부 사항으로부터 보호한다.
 */
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    /** 관리자 면접 기록: 최신 세션부터 내림차순 */
    List<InterviewSession> findAllByOrderByStartedAtDesc();
}
