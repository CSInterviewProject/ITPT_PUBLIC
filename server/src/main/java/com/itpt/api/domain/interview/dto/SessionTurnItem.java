// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.domain.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * SessionTurnItem DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@AllArgsConstructor
public class SessionTurnItem {
    private Long turnId;
    private Long questionId;
    private String transcript;
    private Integer score;
    private String feedback;
}
