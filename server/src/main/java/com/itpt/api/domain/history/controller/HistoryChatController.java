// 파일 목적: history chat 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.history.controller;

import com.itpt.api.domain.history.dto.HistoryChatRequest;
import com.itpt.api.domain.history.dto.HistoryChatResponse;
import com.itpt.api.domain.history.service.HistoryChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HistoryChatController 유스케이스의 HTTP API 진입점이다.
 * 컨트롤러는 라우팅/요청·응답 매핑 같은 전송 계층 책임을 분리한다.
 * 비즈니스 규칙은 서비스에 두어 도메인 로직의 테스트 가능성을 유지한다.
 */
@RestController
@RequestMapping("/api/history-chat")
public class HistoryChatController {

    private final HistoryChatService historyChatService;

    // 함수 목적: HistoryChatController를 생성한다.
    public HistoryChatController(HistoryChatService historyChatService) {
        this.historyChatService = historyChatService;
    }

/**
 * 'chat' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @PostMapping
    public ResponseEntity<HistoryChatResponse> chat(@RequestBody HistoryChatRequest request) {
        return ResponseEntity.ok(historyChatService.chat(request));
    }
}
