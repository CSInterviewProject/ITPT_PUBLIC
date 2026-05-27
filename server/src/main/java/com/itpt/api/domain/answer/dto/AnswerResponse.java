// 파일 목적: answer response용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.answer.dto;

// 위치: src/main/java/com/itpt/api/domain/answer/dto/AnswerResponse.java
// 역할: 응답 데이터 전송 객체(DTO) 정의

import lombok.Getter;

import java.time.LocalDateTime;

/**
 * AnswerResponse DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
public class AnswerResponse {

    private final Long id;
    private final Long userId;
    private final Long questionId;

    // History 화면에서 질문 문장을 보여주기 위해 포함
    private final String questionText;

    private final String topic;
    private final String userAnswer;
    private final Integer score;
    private final String feedback;
    private final LocalDateTime createdAt;

    public AnswerResponse(
            Long id,
            Long userId,
            Long questionId,
            String questionText,
            String topic,
            String userAnswer,
            Integer score,
            String feedback,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.questionId = questionId;
        this.questionText = questionText;
        this.topic = topic;
        this.userAnswer = userAnswer;
        this.score = score;
        this.feedback = feedback;
        this.createdAt = createdAt;
    }
}
