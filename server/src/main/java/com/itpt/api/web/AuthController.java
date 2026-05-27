// 파일 목적: auth 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.web;

import com.itpt.api.domain.admin.systemlog.SystemLogService;
import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserService;
import com.itpt.api.global.security.JwtTokenProvider;
import com.itpt.api.web.dto.LoginRequest;
import com.itpt.api.web.dto.SignUpRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 회원가입/로그인의 HTTP API 진입점이다.
 * 컨트롤러는 웹 요청을 사용자 서비스 동작으로 매핑하고
 * 계정 도메인 규칙을 넣지 않은 채 HTTP 응답/토큰 형태를 구성한다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final SystemLogService systemLogService;

    /**
     * 사용자를 등록하고 최소 프로필 페이로드를 반환한다.
     */
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody SignUpRequest req) {
        User user = userService.signUp(req.getEmail(), req.getName(), req.getPassword());

        systemLogService.write(
                "INFO",
                "AUTH",
                "SIGNUP_SUCCESS",
                "신규 회원가입이 완료되었습니다. email=" + user.getEmail(),
                user.getId()
        );

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName()
        ));
    }

    /**
     * 사용자를 인증하고 API 호출용 액세스 토큰을 발급한다.
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {
        User user = userService.login(req.getEmail(), req.getPassword());
        String accessToken = jwtTokenProvider.createAccessToken(user);

        systemLogService.write(
                "INFO",
                "AUTH",
                "LOGIN_SUCCESS",
                "로그인에 성공했습니다. email=" + user.getEmail(),
                user.getId()
        );

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole(),
                "accessToken", accessToken
        ));
    }
}
