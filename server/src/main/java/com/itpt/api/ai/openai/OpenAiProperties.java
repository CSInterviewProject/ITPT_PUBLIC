// 파일 목적: open ai 설정 프로퍼티 매핑을 정의한다.
package com.itpt.api.ai.openai;

import org.springframework.boot.context.properties.ConfigurationProperties;
/**
 * 파일: com/itpt/api/ai/openai/OpenAiProperties.java
 * 역할: AI(OpenAI) 연동 계층. 답변 평가/피드백/꼬리질문 생성.
 * 연결/흐름: Service → OpenAI Client(이 파일/패키지) → OpenAI API → 평가 결과 DTO 반환
 */
@ConfigurationProperties(prefix = "openai")
public record OpenAiProperties(
        String apiKey,
        String baseUrl,
        String model,
        Boolean mockEnabled
) {}
