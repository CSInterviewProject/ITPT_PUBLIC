// 파일 목적: jwt 설정 프로퍼티 매핑을 정의한다.
package com.itpt.api.global.security;

// 위치: src/main/java/com/itpt/api/global/security/JwtProperties.java
// 역할: application.yml(jwt.*) 설정값 바인딩

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;               // jwt.secret
    private long accessTokenMinutes;     // jwt.access-token-minutes
    private String issuer;               // jwt.issuer
}
