// 파일 목적: interview session 도메인 엔티티 모델을 정의한다.
package com.itpt.api.domain.interview.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "interview_session")
public class InterviewSession {

    public enum Status {
        ACTIVE,
        ENDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 지금은 User 연동을 강하게 걸지 않고 userId만 저장 (나중에 @ManyToOne으로 바꿔도 됨)
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String topic; // "OS", "Network", "Database" 등(너의 mapTopicToServer 기준)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    // 함수 목적: InterviewSession를 생성한다.
    public InterviewSession(Long userId, String topic) {
        this.userId = userId;
        this.topic = topic;
        this.status = Status.ACTIVE;
        this.startedAt = LocalDateTime.now();
    }

    // 함수 목적: end 로직을 구현한다.
    public void end() {
        this.status = Status.ENDED;
        this.endedAt = LocalDateTime.now();
    }
}
