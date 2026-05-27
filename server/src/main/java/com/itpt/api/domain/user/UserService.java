// 파일 목적: user 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.user;

import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

/**
 * 사용자 회원가입/로그인 및 OAuth 사용자 프로비저닝을 담당하는 애플리케이션 서비스다.
 * 서비스는 계정 도메인 규칙(검증, 해싱, 조회)을 집중 관리한다.
 * 이를 통해 컨트롤러와 리포지토리의 책임 분리를 유지한다.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final Pattern SPECIAL_CHAR_PATTERN =
            Pattern.compile("[\\p{Punct}]");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 검증과 중복 확인 후 로컬 사용자 계정을 등록한다.
     */
    @Transactional
    public User signUp(String email, String name, String rawPassword) {
        if (email == null || email.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);
        if (name == null || name.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);
        if (rawPassword == null || rawPassword.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);
        validatePasswordPolicy(rawPassword);

        // 비용이 큰 bcrypt 해싱 전에 중복을 빠르게 실패 처리한다.
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(ErrorCode.USER_EMAIL_EXISTS);
        }

        String passwordHash = passwordEncoder.encode(rawPassword);
        try {
            return userRepository.save(new User(email, name, passwordHash));
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(ErrorCode.USER_EMAIL_EXISTS);
        }
    }

    /**
     * 이메일/비밀번호로 사용자를 인증하고 일치하는 계정을 반환한다.
     */
    @Transactional(readOnly = true)
    public User login(String email, String rawPassword) {
        if (email == null || email.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);
        if (rawPassword == null || rawPassword.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_PASSWORD);
        }

        return user;
    }

    /**
     * 현재 비밀번호 검증 후 로컬 계정의 비밀번호를 변경한다.
     */
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        if (userId == null) throw new ApiException(ErrorCode.UNAUTHORIZED);
        if (currentPassword == null || currentPassword.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);
        if (newPassword == null || newPassword.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new ApiException(ErrorCode.PASSWORD_CHANGE_NOT_ALLOWED);
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_PASSWORD);
        }

        validatePasswordPolicy(newPassword);
        user.updatePasswordHash(passwordEncoder.encode(newPassword));
    }

    /**
     * 회원가입/재설정/변경 흐름에서 사용하는 비밀번호 정책을 검증한다.
     */
    public void validatePasswordPolicy(String rawPassword) {
        if (rawPassword == null) {
            throw new ApiException(ErrorCode.PASSWORD_POLICY_VIOLATION);
        }

        String password = rawPassword;
        boolean meetsLength = password.length() >= MIN_PASSWORD_LENGTH;
        boolean hasSpecialChar = SPECIAL_CHAR_PATTERN.matcher(password).find();

        if (!meetsLength || !hasSpecialChar) {
            throw new ApiException(ErrorCode.PASSWORD_POLICY_VIOLATION);
        }
    }

    /**
     * OAuth 연동 사용자를 찾거나 최초 소셜 로그인 시 새로 생성한다.
     */
    @Transactional
    public User findOrCreateOAuthUser(String email, String name, String provider) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.ofOAuth(email, name, provider.toUpperCase())));
    }
}
