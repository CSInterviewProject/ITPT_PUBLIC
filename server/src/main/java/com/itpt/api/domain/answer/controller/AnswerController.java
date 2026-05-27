// 파일 목적: answer 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.answer.controller;

// 위치: src/main/java/com/itpt/api/domain/answer/controller/AnswerController.java
// 역할: HTTP 요청을 받아 서비스로 위임하고 응답을 반환

import com.itpt.api.domain.answer.dto.AnswerCreateRequest;
import com.itpt.api.domain.answer.dto.AnswerResponse;
import com.itpt.api.domain.answer.service.AnswerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * answer create/read 유스케이스의 HTTP API 진입점이다.
 * 컨트롤러는 요청/응답 매핑을 담당하고 비즈니스 규칙 처리를 위임한다.
 * 전송 계층과 도메인 책임 분리를 위해 AnswerService에 위임한다.
 */
@RestController
@RequestMapping("/api/answers")
public class AnswerController {

    private final AnswerService answerService;

    // 함수 목적: AnswerController를 생성한다.
    public AnswerController(AnswerService answerService) {
        this.answerService = answerService;
    }

    /**
     * 답변 저장
     * POST /api/answers
     */
    @PostMapping
    public ResponseEntity<AnswerResponse> create(@RequestBody AnswerCreateRequest req) {
        return ResponseEntity.ok(answerService.create(req));
    }

    /**
     * 사용자별 최근 답변 20개
     * GET /api/answers/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<List<AnswerResponse>> recent() {
        return ResponseEntity.ok(answerService.recentForCurrentUser(20));
    }
}
