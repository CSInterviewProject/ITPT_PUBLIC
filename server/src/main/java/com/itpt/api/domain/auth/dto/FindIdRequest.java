// 파일 목적: find id request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.auth.dto;

// 위치: server/src/main/java/com/itpt/api/domain/auth/dto/FindIdRequest.java
// 역할: 아이디 찾기에서 이름과 이메일을 전달받기 위한 DTO.

import lombok.Getter;
import lombok.Setter;

/**
 * FindIdRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@Setter
public class FindIdRequest {
    private String name;
    private String email;
}