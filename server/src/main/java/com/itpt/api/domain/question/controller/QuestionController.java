// 파일 목적: question 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.question.controller;

import com.itpt.api.domain.question.dto.QuestionResponse;
import com.itpt.api.domain.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * QuestionController 유스케이스의 HTTP API 진입점이다.
 * 컨트롤러는 라우팅/요청·응답 매핑 같은 전송 계층 책임을 분리한다.
 * 비즈니스 규칙은 서비스에 두어 도메인 로직의 테스트 가능성을 유지한다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    /**
     * GET /api/questions/random?topic=OS
     * GET /api/questions/random?topic=OS&difficulty=2
     * difficulty 미전달 또는 0이면 전체 난이도에서 랜덤
     */
    @GetMapping("/random")
    public QuestionResponse random(
            @RequestParam String topic,
            @RequestParam(required = false) Integer difficulty
    ) {
        return questionService.getRandomByTopic(topic, difficulty);
    }
}