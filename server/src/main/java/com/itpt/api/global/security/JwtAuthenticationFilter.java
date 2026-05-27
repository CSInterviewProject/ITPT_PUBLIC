// 파일 목적: jwt authentication filter 요청/응답 필터 로직을 정의한다.
package com.itpt.api.global.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    // 함수 목적: JwtAuthenticationFilter를 생성한다.
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    // 함수 목적: it should not filter 여부를 판단한다.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path.startsWith("/api/auth/")) return true;
        if (path.equals("/status")) return true;
        if (path.startsWith("/error")) return true;
        if (path.startsWith("/oauth2/")) return true;
        if (path.startsWith("/login/oauth2/")) return true;
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (auth == null || !auth.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7).trim();

        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = tokenProvider.parseClaims(token);
            String email = claims.getSubject();
            Long userId = extractUserId(claims.get("uid"));

            String role = (String) claims.get("role");

            // ✅ hasRole("ADMIN") 은 내부적으로 "ROLE_ADMIN" 을 요구하므로
            //    JWT 에 저장된 "ADMIN"/"USER" 앞에 "ROLE_" prefix 를 붙여야 함
            String resolvedRole = (role != null && !role.isBlank())
                    ? "ROLE_" + role          // "ADMIN" → "ROLE_ADMIN"
                    : "ROLE_USER";

            var authorities = List.of(new SimpleGrantedAuthority(resolvedRole));
            var principal = new JwtAuthenticatedUser(userId, email);
            var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    // 함수 목적: extract user id 로직을 구현한다.
    private Long extractUserId(Object raw) {
        if (raw instanceof Number n) {
            return n.longValue();
        }
        if (raw instanceof String s && !s.isBlank()) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
