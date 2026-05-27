// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.ai.openai;

public final class HistoryAnswerChatSchema {
    private HistoryAnswerChatSchema() {}

    public static final String JSON_SCHEMA = """
    {
      "name": "history_answer_chat",
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "answer": { "type": "string" }
        },
        "required": ["answer"]
      },
      "strict": true
    }
    """;

    public record Result(String answer) {}
}
