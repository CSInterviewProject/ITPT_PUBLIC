// 파일 목적: password config 관련 프레임워크 동작을 설정한다.
package com.itpt.api.global.config;

// 위치: src/main/java/com/itpt/api/global/config/PasswordConfig.java
// 역할: 비밀번호 해시 처리를 위한 PasswordEncoder 빈 등록


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration // 설정 클래스
public class PasswordConfig {

    // ✅ PasswordEncoder 빈 등록(BCrypt 사용)
    // - 회원가입 시: encode()
    // - 로그인 시: matches()
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
