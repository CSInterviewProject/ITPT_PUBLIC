// 파일 목적: answer create request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.answer.dto;

// 위치: src/main/java/com/itpt/api/domain/answer/dto/AnswerCreateRequest.java
// 역할: 요청/응답 데이터 전송 객체(DTO) 정의


import lombok.Getter;
import lombok.Setter;

/**
 * AnswerCreateRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Setter // setter 자동 생성(Lombok)
@Getter // getter 자동 생성(Lombok)
public class AnswerCreateRequest {
    private Long questionId;
    private String topic;
    private String userAnswer;
    private Integer score;
    private String feedback;

}
