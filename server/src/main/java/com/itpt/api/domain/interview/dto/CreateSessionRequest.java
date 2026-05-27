// 파일 목적: create session request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.interview.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * CreateSessionRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@Setter
public class CreateSessionRequest {
    private String topic;       // 필수: "OS", "Java" 등
    private Integer difficulty; // 선택: 1=쉬움, 2=보통, 3=어려움, null=전체
}