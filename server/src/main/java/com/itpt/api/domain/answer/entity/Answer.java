// 파일 목적: answer 도메인 엔티티 모델을 정의한다.
package com.itpt.api.domain.answer.entity;

// 위치: src/main/java/com/itpt/api/domain/answer/entity/Answer.java
// 역할: DB 테이블과 매핑되는 JPA 엔티티 정의

import com.itpt.api.domain.question.entity.Question;
import com.itpt.api.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "answers")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 질문에 대한 답변인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    // 어떤 사용자의 답변인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 과목(토픽): OS/Network/Database/Data Structure 등
    @Column(nullable = true, length = 50)
    private String topic;

    // ✅ 길어질 수 있으니 LONGTEXT로 강제(재발 방지)
    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String userAnswer;

    @Column(nullable = true)
    private Integer score;

    // ✅ 피드백이 길어서 터졌으니 LONGTEXT로 강제
    @Lob
    @Column(nullable = true, columnDefinition = "LONGTEXT")
    private String feedback;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
