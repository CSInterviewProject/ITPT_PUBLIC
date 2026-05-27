// 파일 목적: cors config 관련 프레임워크 동작을 설정한다.
package com.itpt.api.global.config;

// 위치: src/main/java/com/itpt/api/global/config/CorsConfig.java
// 역할: (비활성) CORS 중복 설정 방지용

/**
 * 주의: CORS 설정은 SecurityConfig(corsConfigurationSource) 한 군데에서만 관리한다.
 *
 * 이 파일은 과거 설정이 남아 Bean 충돌이 나는 것을 막기 위해 비활성화(빈/설정 제거)된 상태다.
 * 필요 없다면 파일 자체를 삭제해도 된다.
 */
public class CorsConfig {
    // 의도적으로 비워둠
}
