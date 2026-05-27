// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.security;

import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String provider = ((OAuth2AuthenticationToken) authentication)
                .getAuthorizedClientRegistrationId(); // "google", "kakao", "naver"

        String email = extractEmail(oAuth2User, provider);
        String name  = extractName(oAuth2User, provider);

        // DB에 없으면 자동 회원가입
        User user = userService.findOrCreateOAuthUser(email, name, provider.toUpperCase());

        // 기존 JWT 발급 방식 그대로 사용
        String accessToken = jwtTokenProvider.createAccessToken(user);

        // 프론트 콜백 페이지로 토큰 전달
        getRedirectStrategy().sendRedirect(request, response,
                frontendUrl + "/oauth/callback?token=" + accessToken);
    }

    // 함수 목적: extract email 로직을 구현한다.
    private String extractEmail(OAuth2User user, String provider) {
        return switch (provider) {
            case "google" -> user.getAttribute("email");
            case "kakao"  -> {
                Map<String, Object> account = user.getAttribute("kakao_account");
                yield account != null ? (String) account.get("email") : null;
            }
            case "naver"  -> {
                Map<String, Object> resp = user.getAttribute("response");
                yield resp != null ? (String) resp.get("email") : null;
            }
            default -> throw new RuntimeException("지원하지 않는 OAuth 제공자: " + provider);
        };
    }

    // 함수 목적: extract name 로직을 구현한다.
    private String extractName(OAuth2User user, String provider) {
        return switch (provider) {
            case "google" -> user.getAttribute("name");
            case "kakao"  -> {
                Map<String, Object> props = user.getAttribute("properties");
                yield props != null ? (String) props.get("nickname") : "카카오 사용자";
            }
            case "naver"  -> {
                Map<String, Object> resp = user.getAttribute("response");
                yield resp != null ? (String) resp.get("name") : "네이버 사용자";
            }
            default -> "사용자";
        };
    }
}