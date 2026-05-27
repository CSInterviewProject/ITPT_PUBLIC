// 파일 목적: change password request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * authenticated password change requests DTO 계약을 정의한다.
 */
@Getter
@NoArgsConstructor
public class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
