// 파일 목적: user account 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.user.controller;

import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserRepository;
import com.itpt.api.domain.user.UserService;
import com.itpt.api.domain.user.dto.ChangePasswordRequest;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import com.itpt.api.global.security.JwtAuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 인증된 계정 관리 동작의 HTTP API 진입점이다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/me")
public class UserAccountController {

    private final UserService userService;
    private final UserRepository userRepository;

    // 함수 목적: change password 로직을 구현한다.
    @PatchMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePassword(getCurrentUserId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    // 함수 목적: current user id를 반환한다.
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtAuthenticatedUser jwtUser && jwtUser.getUserId() != null) {
            return jwtUser.getUserId();
        }

        String email = auth.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }
}
