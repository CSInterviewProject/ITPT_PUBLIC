// 파일 목적: next question dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * NextQuestionDto DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@AllArgsConstructor
public class NextQuestionDto {
    private Long id; // DB에서 뽑은 질문이면 id 있음. (꼬리질문 생성형이면 null 가능)
    private String topic;
    private int difficulty;
    private String questionText;
    private String modelAnswer;
    private List<String> requiredKeywords;
    private List<String> optionalKeywords;
    private boolean isGenerated;
}
