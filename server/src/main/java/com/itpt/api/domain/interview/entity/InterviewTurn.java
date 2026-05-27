// 파일 목적: interview turn 도메인 엔티티 모델을 정의한다.
package com.itpt.api.domain.interview.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "interview_turn")
public class InterviewTurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 세션에 귀속
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(name = "question_id")
    private Long questionId;

    @Column(nullable = false)
    private String topic;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // 함수 목적: InterviewTurn를 생성한다.
    public InterviewTurn(InterviewSession session, Long questionId, String topic, String transcript, Integer score, String feedback) {
        this.session = session;
        this.questionId = questionId;
        this.topic = topic;
        this.transcript = transcript;
        this.score = score;
        this.feedback = feedback;
        this.createdAt = LocalDateTime.now();
    }
}
