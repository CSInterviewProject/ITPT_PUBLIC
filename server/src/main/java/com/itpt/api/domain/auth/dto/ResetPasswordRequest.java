// 파일 목적: reset password request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.auth.dto;

// 위치: server/src/main/java/com/itpt/api/domain/auth/dto/ResetPasswordRequest.java
// 역할: 비밀번호 재설정에서 이메일과 새 비밀번호를 전달받기 위한 DTO.

import lombok.Getter;
import lombok.Setter;

/**
 * ResetPasswordRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@Setter
public class ResetPasswordRequest {
    private String email;
    private String newPassword;
}