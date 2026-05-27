// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.stt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Iterator;
import java.util.Locale;
import java.util.Optional;

@Component
public class ClovaSpeechClient {

    private static final Logger log = LoggerFactory.getLogger(ClovaSpeechClient.class);

    private final ClovaSpeechProperties props;
    private final ObjectMapper om;
    private final HttpClient http;

    // 함수 목적: ClovaSpeechClient를 생성한다.
    public ClovaSpeechClient(ClovaSpeechProperties props, ObjectMapper om) {
        this.props = props;
        this.om = om;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    // 함수 목적: recognize 로직을 구현한다.
    public String recognize(byte[] audioBytes, String filename, String contentType, String language) throws Exception {
        if (props.invokeUrl() == null || props.invokeUrl().isBlank()) {
            throw new IllegalStateException("clova.speech.invoke-url 이 설정되지 않았습니다.");
        }
        if (props.secret() == null || props.secret().isBlank()) {
            throw new IllegalStateException("clova.speech.secret 이 설정되지 않았습니다.");
        }
        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalArgumentException("audioBytes is empty");
        }

        String lang = toShortSttLang(language);
        String url = withLangQuery(props.invokeUrl().trim(), lang);

        String safeType = normalizeAudioContentType(contentType);
        String safeName = normalizeFilename(filename, safeType);

        log.info("[CLOVA STT] request url={}", url);
        log.info("[CLOVA STT] input filename={}, originalContentType={}, normalizedContentType={}, size={}, language={}",
                safeName, contentType, safeType, audioBytes.length, language);

        Exception firstError = null;

        try {
            log.info("[CLOVA STT] trying multipart/form-data upload");
            return tryMultipartUpload(url, audioBytes, safeName, safeType);
        } catch (Exception e) {
            firstError = e;
            log.warn("[CLOVA STT] multipart upload failed: {}", e.getMessage(), e);
        }

        try {
            log.info("[CLOVA STT] trying application/octet-stream upload");
            // 💡 여기서 더 이상 contentType을 넘기지 않고 파라미터 2개만 넘깁니다.
            return tryOctetStream(url, audioBytes);
        } catch (Exception e) {
            log.error("[CLOVA STT] octet-stream upload failed: {}", e.getMessage(), e);
            if (firstError != null) {
                throw new RuntimeException(
                        "CLOVA STT 실패. multipart 오류: " + firstError.getMessage() +
                                " / octet-stream 오류: " + e.getMessage(), e
                );
            }
            throw e;
        }
    }

    // 함수 목적: try multipart upload 로직을 구현한다.
    private String tryMultipartUpload(String url, byte[] audioBytes, String filename, String contentType) throws Exception {
        String boundary = "----itpt-boundary-" + System.currentTimeMillis();
        byte[] body = buildMultipart(boundary, audioBytes, filename, contentType);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .header("Accept", "application/json;UTF-8")
                .header("X-CLOVASPEECH-API-KEY", props.secret())
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        log.info("[CLOVA STT] multipart response status={}", res.statusCode());
        log.info("[CLOVA STT] multipart response body={}", safeBody(res.body()));

        if (res.statusCode() < 200 || res.statusCode() >= 300) {
            throw new RuntimeException("multipart 실패(" + res.statusCode() + "): " + safeBody(res.body()));
        }

        return extractRequiredText(res.body(), "multipart");
    }

    // 💡 가장 중요한 부분: 헤더를 무조건 application/octet-stream으로 고정합니다.
    private String tryOctetStream(String url, byte[] audioBytes) throws Exception {
        String ct = "application/octet-stream";
        log.info("[CLOVA STT] octet-stream Content-Type={}", ct);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(60))
                .header("Accept", "application/json;UTF-8")
                .header("Content-Type", ct) // <- 네이버 API 필수 규격
                .header("X-CLOVASPEECH-API-KEY", props.secret())
                .POST(HttpRequest.BodyPublishers.ofByteArray(audioBytes))
                .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        log.info("[CLOVA STT] octet-stream response status={}", res.statusCode());
        log.info("[CLOVA STT] octet-stream response body={}", safeBody(res.body()));

        if (res.statusCode() < 200 || res.statusCode() >= 300) {
            throw new RuntimeException("octet-stream 실패(" + res.statusCode() + "): " + safeBody(res.body()));
        }

        return extractRequiredText(res.body(), "octet-stream");
    }

    // 함수 목적: extract required text 로직을 구현한다.
    private String extractRequiredText(String responseBody, String mode) {
        String text = extractText(responseBody)
                .map(String::trim)
                .orElse("");

        if (text.isBlank()) {
            throw new RuntimeException(
                    "CLOVA STT " + mode + " 응답은 성공했지만 추출된 텍스트가 비어있습니다. body=" + safeBody(responseBody)
            );
        }

        return text;
    }

    // 함수 목적: multipart를 구성한다.
    private byte[] buildMultipart(String boundary, byte[] audioBytes, String filename, String contentType) {
        String ln = "\r\n";

        byte[] header = (
                "--" + boundary + ln +
                        "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"" + ln +
                        "Content-Type: " + contentType + ln + ln
        ).getBytes(StandardCharsets.UTF_8);

        byte[] tail = (
                ln + "--" + boundary + "--" + ln
        ).getBytes(StandardCharsets.UTF_8);

        byte[] body = new byte[header.length + audioBytes.length + tail.length];
        int o = 0;

        System.arraycopy(header, 0, body, o, header.length);
        o += header.length;

        System.arraycopy(audioBytes, 0, body, o, audioBytes.length);
        o += audioBytes.length;

        System.arraycopy(tail, 0, body, o, tail.length);

        return body;
    }

    // 함수 목적: with lang query 로직을 구현한다.
    private String withLangQuery(String baseUrl, String lang) {
        String encoded = URLEncoder.encode(lang, StandardCharsets.UTF_8);
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + "lang=" + encoded;
    }

    // 함수 목적: to short stt lang 로직을 구현한다.
    private String toShortSttLang(String language) {
        if (language == null || language.isBlank()) return "Kor";

        String lower = language.toLowerCase(Locale.ROOT);
        if (lower.startsWith("ko")) return "Kor";
        if (lower.startsWith("en")) return "Eng";
        if (lower.startsWith("ja")) return "Jpn";
        if (lower.startsWith("zh")) return "Chn";
        return "Kor";
    }

    // 함수 목적: audio content type를 정규화한다.
    private String normalizeAudioContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }

        String lower = contentType.toLowerCase(Locale.ROOT).trim();

        if (lower.startsWith("audio/webm")) return "audio/webm";
        if (lower.startsWith("audio/ogg")) return "audio/ogg";
        if (lower.startsWith("audio/wav")) return "audio/wav";
        if (lower.startsWith("audio/x-wav")) return "audio/wav";
        if (lower.startsWith("audio/wave")) return "audio/wav";
        if (lower.startsWith("audio/mpeg")) return "audio/mpeg";
        if (lower.startsWith("audio/mp3")) return "audio/mpeg";
        if (lower.startsWith("audio/mp4")) return "audio/mp4";
        if (lower.startsWith("audio/aac")) return "audio/aac";
        if (lower.startsWith("audio/flac")) return "audio/flac";
        if (lower.startsWith("application/octet-stream")) return "application/octet-stream";

        return "application/octet-stream";
    }

    // 함수 목적: filename를 정규화한다.
    private String normalizeFilename(String filename, String contentType) {
        String base = (filename == null || filename.isBlank()) ? "record" : filename.trim();

        int dot = base.lastIndexOf('.');
        if (dot > 0) {
            base = base.substring(0, dot);
        }

        String ext;
        switch (contentType) {
            case "audio/webm":
                ext = ".webm";
                break;
            case "audio/ogg":
                ext = ".ogg";
                break;
            case "audio/wav":
                ext = ".wav";
                break;
            case "audio/mpeg":
                ext = ".mp3";
                break;
            case "audio/mp4":
                ext = ".mp4";
                break;
            case "audio/aac":
                ext = ".aac";
                break;
            case "audio/flac":
                ext = ".flac";
                break;
            default:
                ext = ".bin";
                break;
        }

        return base + ext;
    }

    // 함수 목적: extract text 로직을 구현한다.
    private Optional<String> extractText(String json) {
        try {
            JsonNode root = om.readTree(json);

            log.info("[CLOVA STT] parsed root node type={}", root.getNodeType());
            log.info("[CLOVA STT] parsed root field names={}", collectFieldNames(root));

            if (root.hasNonNull("text")) {
                String value = root.get("text").asText("");
                if (!value.isBlank()) return Optional.of(value);
            }

            if (root.hasNonNull("result")) {
                JsonNode result = root.get("result");
                if (result.isTextual()) {
                    String value = result.asText("");
                    if (!value.isBlank()) return Optional.of(value);
                }
                if (result.hasNonNull("text")) {
                    String value = result.get("text").asText("");
                    if (!value.isBlank()) return Optional.of(value);
                }
                if (result.hasNonNull("transcript")) {
                    String value = result.get("transcript").asText("");
                    if (!value.isBlank()) return Optional.of(value);
                }
            }

            if (root.hasNonNull("transcript")) {
                String value = root.get("transcript").asText("");
                if (!value.isBlank()) return Optional.of(value);
            }

            JsonNode segments = root.path("segments");
            if (segments.isArray() && !segments.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode seg : segments) {
                    String t = seg.path("text").asText("");
                    if (!t.isBlank()) {
                        if (sb.length() > 0) sb.append(' ');
                        sb.append(t);
                    }
                }
                if (sb.length() > 0) return Optional.of(sb.toString());
            }

            JsonNode data = root.path("data");
            if (data.hasNonNull("text")) {
                String value = data.get("text").asText("");
                if (!value.isBlank()) return Optional.of(value);
            }
            if (data.hasNonNull("transcript")) {
                String value = data.get("transcript").asText("");
                if (!value.isBlank()) return Optional.of(value);
            }

            JsonNode utterance = root.path("utterance");
            if (utterance.hasNonNull("text")) {
                String value = utterance.get("text").asText("");
                if (!value.isBlank()) return Optional.of(value);
            }

            log.warn("[CLOVA STT] text not found in response body={}", safeBody(json));
            return Optional.empty();
        } catch (Exception e) {
            log.warn("[CLOVA STT] extractText failed: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    // 함수 목적: collect field names 로직을 구현한다.
    private String collectFieldNames(JsonNode node) {
        if (node == null || !node.isObject()) return "[]";

        StringBuilder sb = new StringBuilder("[");
        Iterator<String> it = node.fieldNames();
        boolean first = true;
        while (it.hasNext()) {
            if (!first) sb.append(", ");
            sb.append(it.next());
            first = false;
        }
        sb.append("]");
        return sb.toString();
    }

    // 함수 목적: safe body 로직을 구현한다.
    private String safeBody(String body) {
        if (body == null) return "";
        return body.length() > 1000 ? body.substring(0, 1000) + "...(truncated)" : body;
    }
}