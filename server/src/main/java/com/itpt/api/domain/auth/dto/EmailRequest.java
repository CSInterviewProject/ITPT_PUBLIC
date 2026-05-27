// 파일 목적: email request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.auth.dto;

// 위치: server/src/main/java/com/itpt/api/domain/auth/dto/EmailRequest.java
// 역할: 비밀번호 재설정용 인증번호 전송 요청에서 이메일 값만 전달받는 DTO.

import lombok.Getter;
import lombok.Setter;

/**
 * EmailRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@Setter
public class EmailRequest {
    private String email;
}