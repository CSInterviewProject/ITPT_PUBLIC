// 위치: com/itpt/api/ai/openai/OpenAiResponsesClient.java
// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.ai.openai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itpt.api.domain.admin.systemlog.SystemLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 파일: com/itpt/api/ai/openai/OpenAiResponsesClient.java
 * 역할: AI(OpenAI) 연동 계층. 답변 평가/피드백/꼬리질문 생성.
 * 연결/흐름: Service → OpenAI Client(이 파일/패키지) → OpenAI API → 평가 결과 DTO 반환
 */
@Component
public class OpenAiResponsesClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiResponsesClient.class);

    private final OpenAiProperties props;
    private final RestClient restClient;
    private final ObjectMapper om;
    private final SystemLogService systemLogService;

    // 함수 목적: OpenAiResponsesClient를 생성한다.
    public OpenAiResponsesClient(OpenAiProperties props, ObjectMapper om, SystemLogService systemLogService) {
        this.props = props;
        this.om = om;
        this.systemLogService = systemLogService;

        this.restClient = RestClient.builder()
                .baseUrl((props.baseUrl() == null || props.baseUrl().isBlank())
                        ? "https://api.openai.com/v1"
                        : props.baseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + props.apiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // 함수 목적: json response를 생성한다.
    public String createJsonResponse(String model, String instructions, List<Map<String, Object>> inputItems) {
        return createJsonResponse(model, instructions, inputItems, InterviewEvaluationSchema.JSON_SCHEMA);
    }

    public String createJsonResponse(
            String model,
            String instructions,
            List<Map<String, Object>> inputItems,
            String schemaJson
    ) {

        if (schemaJson == null || schemaJson.isBlank()) {
            throw new IllegalArgumentException("schemaJson is required");
        }

        JsonNode root = readSchemaNode(schemaJson);

        String name = root.path("name").asText("structured_output");
        boolean strict = root.path("strict").asBoolean(true);

        JsonNode schemaNode = root.path("schema");
        if (schemaNode.isMissingNode() || schemaNode.isNull()) {
            throw new IllegalStateException("JSON_SCHEMA must contain non-null 'schema'");
        }

        Map<String, Object> schemaMap = om.convertValue(
                schemaNode,
                new TypeReference<Map<String, Object>>() {}
        );

        Object schemaType = schemaMap.get("type");
        if (!(schemaType instanceof String) || ((String) schemaType).isBlank()) {
            throw new IllegalStateException("Invalid JSON schema: schema.type is missing (expected 'object')");
        }

        List<Map<String, Object>> input = new ArrayList<>();
        if (instructions != null && !instructions.isBlank()) {
            input.add(Map.of("role", "system", "content", instructions));
        }
        if (inputItems != null && !inputItems.isEmpty()) {
            input.addAll(inputItems);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("input", input);

        Map<String, Object> format = new HashMap<>();
        format.put("type", "json_schema");
        format.put("name", name);
        format.put("strict", strict);
        format.put("schema", schemaMap);

        body.put("text", Map.of("format", format));

        String rawResponse;
        try {
            rawResponse = restClient.post()
                    .uri("/responses")
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("OpenAI responses API call failed. model={}", model, e);
            systemLogService.write(
                    "ERROR",
                    "OPENAI",
                    "RESPONSES_API_FAILED",
                    "OpenAI Responses API 호출 실패: " + e.getClass().getSimpleName(),
                    null
            );
            throw e;
        }

        JsonNode res;
        try {
            res = om.readTree(rawResponse);
        } catch (Exception e) {
            log.error("Failed to parse OpenAI response JSON. raw={}", safeTruncate(rawResponse), e);
            systemLogService.write(
                    "WARN",
                    "OPENAI",
                    "RESPONSE_PARSE_FAILED",
                    "OpenAI 응답 JSON 파싱 실패 - fallback 가능성 있음",
                    null
            );
            throw new IllegalStateException("Failed to parse OpenAI response JSON. raw=" + safeTruncate(rawResponse), e);
        }

        return extractAnyText(res);
    }

    // 함수 목적: read schema node 로직을 구현한다.
    private JsonNode readSchemaNode(String schemaJson) {
        try {
            return om.readTree(schemaJson);
        } catch (Exception e) {
            log.error("Invalid JSON schema string", e);
            systemLogService.write(
                    "WARN",
                    "OPENAI",
                    "SCHEMA_PARSE_FAILED",
                    "OpenAI JSON schema 파싱 실패",
                    null
            );
            throw new IllegalStateException("Invalid JSON schema string", e);
        }
    }

    // 함수 목적: extract any text 로직을 구현한다.
    private String extractAnyText(JsonNode root) {
        if (root == null) return "";

        JsonNode outputText = root.get("output_text");
        if (outputText != null && outputText.isTextual()) return outputText.asText();

        JsonNode output = root.get("output");
        if (output != null && output.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode outItem : output) {
                JsonNode content = outItem.get("content");
                if (content != null && content.isArray()) {
                    for (JsonNode c : content) {
                        JsonNode text = c.get("text");
                        if (text != null && text.isTextual()) sb.append(text.asText());
                    }
                }
            }
            return sb.toString().trim();
        }

        return "";
    }

    // 함수 목적: safe truncate 로직을 구현한다.
    private String safeTruncate(String s) {
        if (s == null) return "";
        return s.length() > 500 ? s.substring(0, 500) + "..." : s;
    }
}
