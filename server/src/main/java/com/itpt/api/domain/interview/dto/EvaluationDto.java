// 파일 목적: evaluation dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * EvaluationDto DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@AllArgsConstructor
public class EvaluationDto {
    private int score;
    private String feedback;
    private List<String> missingKeywords;
    private List<String> strengths;
    private List<String> improvements;
}
