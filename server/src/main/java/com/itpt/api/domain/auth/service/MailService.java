// 파일 목적: mail 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.auth.service;

// 위치: server/src/main/java/com/itpt/api/domain/auth/service/MailService.java
// 역할: Gmail SMTP를 사용하여 사용자의 이메일로 인증번호 메일을 발송하는 서비스.

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * MailService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

/**
 * 'send verification code' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public void sendVerificationCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[ITPT] 이메일 인증번호 안내");
        message.setText(
                "안녕하세요.\n\n" +
                        "인증번호는 [" + code + "] 입니다.\n" +
                        "5분 이내에 입력해주세요.\n\n" +
                        "감사합니다."
        );

        mailSender.send(message);
    }
}