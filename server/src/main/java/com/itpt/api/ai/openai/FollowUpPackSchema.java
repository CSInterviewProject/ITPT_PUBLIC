// 위치: com/itpt/api/ai/openai/FollowUpPackSchema.java
// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.ai.openai;
/**
 * 파일: com/itpt/api/ai/openai/FollowUpPackSchema.java
 * 역할: AI(OpenAI) 연동 계층. 답변 평가/피드백/꼬리질문 생성.
 * 연결/흐름: Service → OpenAI Client(이 파일/패키지) → OpenAI API → 평가 결과 DTO 반환
 */

import java.util.List;

public final class FollowUpPackSchema {
    private FollowUpPackSchema() {}

    // ✅ 꼬리질문 학습 패키지(모범답안/키워드) 스키마
    public static final String JSON_SCHEMA = """
    {
      "name": "followup_pack",
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "modelAnswer": { "type": "string" },
          "requiredKeywords": { "type": "array", "items": { "type": "string" } },
          "optionalKeywords": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["modelAnswer", "requiredKeywords", "optionalKeywords"]
      },
      "strict": true
    }
    """;

    public record Result(
            String modelAnswer,
            List<String> requiredKeywords,
            List<String> optionalKeywords
    ) {}
}
