// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.ai.openai;

import java.util.List;

/**
 * 파일: com/itpt/api/ai/openai/InterviewEvaluationSchema.java
 * 역할: AI(OpenAI) 연동 계층. 답변 평가/피드백/꼬리질문 생성.
 * 연결/흐름: Service → OpenAI Client(이 파일/패키지) → OpenAI API → 평가 결과 DTO 반환
 */
public final class InterviewEvaluationSchema {
    private InterviewEvaluationSchema() {}

    // ✅ Structured Outputs(JSON Schema) - 모델이 반드시 이 형태로 JSON을 출력하도록 강제
    public static final String JSON_SCHEMA = """
    {
      "name": "interview_evaluation",
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "score": { "type": "integer", "minimum": 0, "maximum": 100 },
          "feedback": { "type": "string" },
          "missingKeywords": { "type": "array", "items": { "type": "string" } },
          "followUpQuestion": { "type": "string" },
          "strengths": { "type": "array", "items": { "type": "string" } },
          "improvements": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["score", "feedback", "missingKeywords", "followUpQuestion", "strengths", "improvements"]
      },
      "strict": true
    }
    """;

    public record Result(
            int score,
            String feedback,
            List<String> missingKeywords,
            String followUpQuestion,
            List<String> strengths,
            List<String> improvements
    ) {}
}
