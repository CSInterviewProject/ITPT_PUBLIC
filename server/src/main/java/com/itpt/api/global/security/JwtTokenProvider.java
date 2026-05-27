// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.security;

// 위치: src/main/java/com/itpt/api/global/security/JwtTokenProvider.java
// 역할: JWT 생성/검증/클레임 파싱

import com.itpt.api.domain.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private final JwtProperties props;
    private final SecretKey key;

    // 함수 목적: JwtTokenProvider를 생성한다.
    public JwtTokenProvider(JwtProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    // ✅ Access Token 생성 (Bearer로 쓸 토큰)
    public String createAccessToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getAccessTokenMinutes() * 60);

        return Jwts.builder()
                .issuer(props.getIssuer())
                .subject(user.getEmail()) // sub = email
                .claims(Map.of(
                        "uid",      user.getId(),
                        "name",     user.getName(),
                        "role",     user.getRole(),
                        "provider", user.getProvider() != null ? user.getProvider().toLowerCase() : "local" // ✅ 추가
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    // ✅ 토큰 유효성 검증 + Claims 반환
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}