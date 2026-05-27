// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.domain.history.service;

import java.util.List;

/**
 * HistoryChatContext 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
public record HistoryChatContext(
        Long answerId,
        String topic,
        String questionText,
        String modelAnswer,
        List<String> requiredKeywords,
        List<String> optionalKeywords,
        String userAnswer,
        Integer score,
        String feedback
) {
}
