// 파일 목적: user의 영속성 접근 연산을 정의한다.
package com.itpt.api.domain.user; // user 도메인 패키지

// 위치: src/main/java/com/itpt/api/domain/user/UserRepository.java
// 역할: 프로젝트 동작에 필요한 구성 요소


import org.springframework.data.jpa.repository.JpaRepository; // JPA 기본 CRUD 제공 인터페이스

import java.util.Optional; // ✅ 추가: findByEmail 반환 타입

/**
 * user account data용 영속성 추상화 계층이다.
 * 리포지토리는 계정 조회/중복 확인을 영속성 계층 가까이에 모은다.
 * 조회 세부 구현이 상위 계층으로 새어나가지 않게 한다.
 */
public interface UserRepository extends JpaRepository<User, Long> {
    // User 엔티티를 대상으로 CRUD(저장/조회/수정/삭제) 메서드를 자동 제공
    // Long은 User의 PK 타입(id가 Long이기 때문)

    // ✅ 추가: 로그인/중복확인에 사용할 이메일 조회
    /**
     * 로그인과 토큰 subject 해석을 위해 이메일로 사용자를 조회한다.
     */
    Optional<User> findByEmail(String email);

    // 이름+이메일 조회를 통해 아이디 찾기/비밀번호 재설정 대상 사용자를 찾는다.
    /**
     * 계정 복구 흐름을 위해 이름/이메일 조합으로 사용자를 조회한다.
     */
    Optional<User> findByNameAndEmail(String name, String email);

    // ✅ 추가: 회원가입 시 이메일 중복 체크
    /**
     * 회원가입 저장 전에 이메일 중복을 확인한다.
     */
    boolean existsByEmail(String email);
}
