// 파일 목적: sign up request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.web.dto;

// 위치: src/main/java/com/itpt/api/web/dto/SignUpRequest.java
// 역할: 회원가입 요청 바디(JSON) 매핑 DTO


import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * SignUpRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@NoArgsConstructor
public class SignUpRequest {
    private String email;
    private String name;
    private String password;
}
