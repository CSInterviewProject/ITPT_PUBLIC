// 파일 목적: email auth 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.auth.service;

// 위치: server/src/main/java/com/itpt/api/domain/auth/service/EmailAuthService.java
// 역할: DB 없이 메모리(Map)에 이메일 인증번호, 만료시간, 인증상태, 인증목적을 저장하고 검증하는 서비스.

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EmailAuthService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Service
@RequiredArgsConstructor
public class EmailAuthService {

    private final MailService mailService;

    // 이메일별 인증번호 저장
    private final Map<String, String> codeStore = new ConcurrentHashMap<>();

    // 이메일별 인증번호 만료시간 저장
    private final Map<String, LocalDateTime> expireStore = new ConcurrentHashMap<>();

    // 이메일별 인증 완료 여부 저장
    private final Map<String, Boolean> verifiedStore = new ConcurrentHashMap<>();

    // 이메일별 인증 목적 저장 (FIND_ID / RESET_PASSWORD)
    private final Map<String, String> purposeStore = new ConcurrentHashMap<>();

    /**
     * 인증번호를 생성하고 메일로 전송한 뒤 메모리에 저장한다.
     */
    public void sendCode(String email, String purpose) {
        String code = createCode();

        codeStore.put(email, code);
        expireStore.put(email, LocalDateTime.now().plusMinutes(5));
        verifiedStore.put(email, false);
        purposeStore.put(email, purpose);

        mailService.sendVerificationCode(email, code);
    }

    /**
     * 사용자가 입력한 인증번호를 검증한다.
     */
    public void verifyCode(String email, String code, String purpose) {
        if (!codeStore.containsKey(email)) {
            throw new IllegalArgumentException("인증번호 요청 내역이 없습니다.");
        }

        if (!purpose.equals(purposeStore.get(email))) {
            throw new IllegalArgumentException("인증 목적이 올바르지 않습니다.");
        }

        LocalDateTime expireTime = expireStore.get(email);
        if (expireTime == null || expireTime.isBefore(LocalDateTime.now())) {
            clear(email);
            throw new IllegalArgumentException("인증번호가 만료되었습니다.");
        }

        String savedCode = codeStore.get(email);
        if (!savedCode.equals(code)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        verifiedStore.put(email, true);
    }

    /**
     * 해당 이메일이 특정 목적에 대해 인증 완료되었는지 확인한다.
     */
    public boolean isVerified(String email, String purpose) {
        if (!verifiedStore.containsKey(email)) {
            return false;
        }

        if (!purpose.equals(purposeStore.get(email))) {
            return false;
        }

        LocalDateTime expireTime = expireStore.get(email);
        if (expireTime == null || expireTime.isBefore(LocalDateTime.now())) {
            clear(email);
            return false;
        }

        return Boolean.TRUE.equals(verifiedStore.get(email));
    }

    /**
     * 인증 관련 캐시 데이터를 모두 삭제한다.
     */
    public void clear(String email) {
        codeStore.remove(email);
        expireStore.remove(email);
        verifiedStore.remove(email);
        purposeStore.remove(email);
    }

    /**
     * 6자리 숫자 인증번호 생성
     */
    private String createCode() {
        Random random = new Random();
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }
}
