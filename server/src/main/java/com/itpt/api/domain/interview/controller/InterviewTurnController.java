// 파일 목적: interview turn 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.interview.controller;

import com.itpt.api.domain.interview.dto.InterviewTurnRequest;
import com.itpt.api.domain.interview.dto.InterviewTurnResponse;
import com.itpt.api.domain.interview.service.InterviewSessionService;
import com.itpt.api.domain.interview.service.InterviewTurnService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * InterviewTurnController 유스케이스의 HTTP API 진입점이다.
 * 컨트롤러는 라우팅/요청·응답 매핑 같은 전송 계층 책임을 분리한다.
 * 비즈니스 규칙은 서비스에 두어 도메인 로직의 테스트 가능성을 유지한다.
 */
@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewTurnController {

    private final InterviewTurnService interviewTurnService;
    private final InterviewSessionService interviewSessionService;

/**
 * 'create turn' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @PostMapping("/turns")
    public InterviewTurnResponse createTurn(@RequestBody InterviewTurnRequest req) {
        // ✅ sessionId가 오면 세션 로그에 저장하면서 처리
        if (req.getSessionId() != null) {
            return interviewSessionService.createTurn(req.getSessionId(), req);
        }
        // ✅ 세션 없이 단일 턴만 처리
        return interviewTurnService.processTurn(req);
    }
}
