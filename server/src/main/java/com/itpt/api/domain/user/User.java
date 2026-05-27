// 파일 목적: user 도메인 엔티티 모델을 정의한다.
package com.itpt.api.domain.user;

// 위치: server/src/main/java/com/itpt/api/domain/user/User.java
// 역할: 사용자 정보를 저장하는 엔티티.
//       일반 회원가입/소셜 로그인 사용자 정보를 관리하고,
//       권한 변경, 상태 토글, 비밀번호 해시 변경 기능을 제공한다.

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = true, length = 200)
    private String passwordHash;

    @Column(nullable = false, length = 20)
    private String role = "USER";

    // 계정 상태 (ACTIVE / INACTIVE)
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    // 가입일시
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // OAuth 제공자 구분 (일반 가입은 null, 소셜은 "GOOGLE"/"KAKAO"/"NAVER")
    @Column(nullable = true, length = 20)
    private String provider;

    // 일반 회원가입용 생성자
    public User(String email, String name, String passwordHash) {
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
        this.role = "USER";
        this.status = "ACTIVE";
        this.createdAt = LocalDateTime.now();
        this.provider = null;
    }

    // OAuth 자동 가입용 정적 팩토리 메서드
    public static User ofOAuth(String email, String name, String provider) {
        User user = new User();
        user.email = email;
        user.name = name;
        user.passwordHash = null;
        user.role = "USER";
        user.status = "ACTIVE";
        user.createdAt = LocalDateTime.now();
        user.provider = provider;
        return user;
    }

    // 함수 목적: change role 로직을 구현한다.
    public void changeRole(String role) {
        this.role = role;
    }

    // 활성/비활성 토글
    public void toggleStatus() {
        this.status = "ACTIVE".equals(this.status) ? "INACTIVE" : "ACTIVE";
    }

    // 비밀번호 해시 변경
    public void updatePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}