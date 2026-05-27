// 파일 목적: verify code request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.auth.dto;

// 위치: server/src/main/java/com/itpt/api/domain/auth/dto/VerifyCodeRequest.java
// 역할: 사용자가 입력한 이메일과 인증번호를 서버로 전달해 인증번호 검증에 사용하는 DTO.

import lombok.Getter;
import lombok.Setter;

/**
 * VerifyCodeRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@Setter
public class VerifyCodeRequest {
    private String email;
    private String code;
}