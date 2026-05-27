// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.security;

import java.security.Principal;
import java.util.Objects;

public final class JwtAuthenticatedUser implements Principal {

    private final Long userId;
    private final String email;

    // 함수 목적: JwtAuthenticatedUser를 생성한다.
    public JwtAuthenticatedUser(Long userId, String email) {
        this.userId = userId;
        this.email = Objects.requireNonNull(email, "email");
    }

    // 함수 목적: user id를 반환한다.
    public Long getUserId() {
        return userId;
    }

    // 함수 목적: name를 반환한다.
    @Override
    public String getName() {
        return email;
    }

    // 함수 목적: to string 로직을 구현한다.
    @Override
    public String toString() {
        return email;
    }
}
