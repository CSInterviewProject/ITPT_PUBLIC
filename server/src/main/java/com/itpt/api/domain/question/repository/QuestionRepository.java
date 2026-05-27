// 파일 목적: question의 영속성 접근 연산을 정의한다.
package com.itpt.api.domain.question.repository;

import com.itpt.api.domain.question.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * QuestionRepository용 영속성 추상화 계층이다.
 * 리포지토리는 데이터 접근/조회 로직을 중앙화하고
 * 상위 계층을 JPA/SQL 세부 사항으로부터 보호한다.
 */
public interface QuestionRepository extends JpaRepository<Question, Long> {
    @Query("select k from Question q join q.requiredKeywords k where q.id = :id")
    List<String> findRequiredKeywordsByQuestionId(@Param("id") Long id);

    @Query("select k from Question q join q.optionalKeywords k where q.id = :id")
    List<String> findOptionalKeywordsByQuestionId(@Param("id") Long id);

    long countByTopic(String topic);

    long countByTopicAndDifficulty(String topic, int difficulty);

    Page<Question> findByTopic(String topic, Pageable pageable);

    Page<Question> findByTopicAndDifficulty(String topic, int difficulty, Pageable pageable);

    @Query("select q.id from Question q where q.topic = :topic")
    List<Long> findIdsByTopic(@Param("topic") String topic);

    @Query("select q.id from Question q where q.topic = :topic and q.difficulty = :difficulty")
    List<Long> findIdsByTopicAndDifficulty(@Param("topic") String topic, @Param("difficulty") int difficulty);
}
