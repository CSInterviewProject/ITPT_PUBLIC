// 파일 목적: auth recovery 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.auth.controller;

// 위치: server/src/main/java/com/itpt/api/domain/auth/controller/AuthRecoveryController.java
// 역할: 아이디 찾기/비밀번호 재설정 관련 API를 제공하는 컨트롤러.
//       인증번호 전송, 인증번호 검증, 아이디 조회, 비밀번호 변경 요청을 처리한다.

import com.itpt.api.domain.auth.dto.EmailRequest;
import com.itpt.api.domain.auth.dto.FindIdRequest;
import com.itpt.api.domain.auth.dto.ResetPasswordRequest;
import com.itpt.api.domain.auth.dto.VerifyCodeRequest;
import com.itpt.api.domain.auth.service.EmailAuthService;
import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserRepository;
import com.itpt.api.domain.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AuthRecoveryController 유스케이스의 HTTP API 진입점이다.
 * 컨트롤러는 라우팅/요청·응답 매핑 같은 전송 계층 책임을 분리한다.
 * 비즈니스 규칙은 서비스에 두어 도메인 로직의 테스트 가능성을 유지한다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/recovery")
public class AuthRecoveryController {

    private final EmailAuthService emailAuthService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    private static final String PURPOSE_FIND_ID = "FIND_ID";
    private static final String PURPOSE_RESET_PASSWORD = "RESET_PASSWORD";

    /**
     * 아이디 찾기용 인증번호 전송
     */
    @PostMapping("/find-id/send-code")
    public ResponseEntity<?> sendFindIdCode(@RequestBody FindIdRequest request) {
        User user = userRepository.findByNameAndEmail(request.getName(), request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));

        emailAuthService.sendCode(user.getEmail(), PURPOSE_FIND_ID);

        return ResponseEntity.ok(Map.of(
                "message", "인증번호를 전송했습니다."
        ));
    }

    /**
     * 아이디 찾기용 인증번호 검증
     */
    @PostMapping("/find-id/verify")
    public ResponseEntity<?> verifyFindIdCode(@RequestBody VerifyCodeRequest request) {
        emailAuthService.verifyCode(request.getEmail(), request.getCode(), PURPOSE_FIND_ID);

        return ResponseEntity.ok(Map.of(
                "message", "이메일 인증이 완료되었습니다."
        ));
    }

    /**
     * 아이디 찾기
     */
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody FindIdRequest request) {
        boolean verified = emailAuthService.isVerified(request.getEmail(), PURPOSE_FIND_ID);
        if (!verified) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        User user = userRepository.findByNameAndEmail(request.getName(), request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));

        // 현재 예시는 로그인 아이디가 이메일인 경우
        String loginId = user.getEmail();

        emailAuthService.clear(request.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "아이디 찾기에 성공했습니다.",
                "loginId", loginId
        ));
    }

    /**
     * 비밀번호 재설정용 인증번호 전송
     */
    @PostMapping("/reset-password/send-code")
    public ResponseEntity<?> sendResetPasswordCode(@RequestBody EmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));

        emailAuthService.sendCode(user.getEmail(), PURPOSE_RESET_PASSWORD);

        return ResponseEntity.ok(Map.of(
                "message", "인증번호를 전송했습니다."
        ));
    }

    /**
     * 비밀번호 재설정용 인증번호 검증
     */
    @PostMapping("/reset-password/verify")
    public ResponseEntity<?> verifyResetPasswordCode(@RequestBody VerifyCodeRequest request) {
        emailAuthService.verifyCode(request.getEmail(), request.getCode(), PURPOSE_RESET_PASSWORD);

        return ResponseEntity.ok(Map.of(
                "message", "이메일 인증이 완료되었습니다."
        ));
    }

    /**
     * 비밀번호 재설정
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        boolean verified = emailAuthService.isVerified(request.getEmail(), PURPOSE_RESET_PASSWORD);
        if (!verified) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));

        userService.validatePasswordPolicy(request.getNewPassword());
        user.updatePasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        emailAuthService.clear(request.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "비밀번호가 변경되었습니다."
        ));
    }
}
