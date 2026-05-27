// 파일 목적: interview turn의 영속성 접근 연산을 정의한다.
package com.itpt.api.domain.interview.repository;

// 위치: src/main/java/com/itpt/api/domain/interview/repository/InterviewTurnRepository.java

import com.itpt.api.domain.interview.entity.InterviewTurn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * InterviewTurnRepository용 영속성 추상화 계층이다.
 * 리포지토리는 데이터 접근/조회 로직을 중앙화하고
 * 상위 계층을 JPA/SQL 세부 사항으로부터 보호한다.
 */
public interface InterviewTurnRepository extends JpaRepository<InterviewTurn, Long> {

    /** 세션 리포트: 세션 내 턴을 생성 순으로 조회 */
    List<InterviewTurn> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    /**
     * 관리자 면접 기록 집계 — 세션별 (턴 수, 평균 점수)
     * 반환: Object[] { sessionId(Long), turnCount(Long), avgScore(Double|null) }
     */
    @Query("SELECT t.session.id, COUNT(t), AVG(t.score) " +
            "FROM InterviewTurn t " +
            "WHERE t.score IS NOT NULL " +
            "GROUP BY t.session.id")
    List<Object[]> findSessionStats();

    /**
     * 관리자 카테고리별 통계 — (토픽, 턴 수, 평균 점수)
     * 반환: Object[] { topic(String), count(Long), avgScore(Double|null) }
     */
    @Query("SELECT t.topic, COUNT(t), AVG(t.score) " +
            "FROM InterviewTurn t " +
            "WHERE t.topic IS NOT NULL AND t.score IS NOT NULL " +
            "GROUP BY t.topic " +
            "ORDER BY COUNT(t) DESC")
    List<Object[]> findCategoryStats();

    /**
     * N+1 방지용: 세션과 함께 전체 턴 조회 (bestScore 계산용)
     */
    @Query("SELECT t FROM InterviewTurn t JOIN FETCH t.session WHERE t.score IS NOT NULL")
    List<InterviewTurn> findAllWithSessionAndScore();
}
