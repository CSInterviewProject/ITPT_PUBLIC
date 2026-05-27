// 파일 목적: answer의 영속성 접근 연산을 정의한다.
package com.itpt.api.domain.answer.repository;

import com.itpt.api.domain.answer.entity.Answer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * AnswerRepository용 영속성 추상화 계층이다.
 * 리포지토리는 데이터 접근/조회 로직을 중앙화하고
 * 상위 계층을 JPA/SQL 세부 사항으로부터 보호한다.
 */
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findTop20ByOrderByCreatedAtDesc();

    // History 페이지용: user + question을 같이 로딩
    @EntityGraph(attributePaths = {"question", "user"})
    List<Answer> findTop20ByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Answer> findAllByUser_Id(Long userId);

    @Override
    @EntityGraph(attributePaths = {"question", "user"})
    Optional<Answer> findById(Long id);

    // 관리자용 — user + question 함께 로딩한 전체 답변 (N+1 방지)
    @EntityGraph(attributePaths = {"user", "question"})
    @Query("SELECT a FROM Answer a")
    List<Answer> findAllWithUser();
}
