// 파일 목적: stt 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.stt;

// 위치: src/main/java/com/itpt/api/stt/SttController.java
// 역할: 프론트에서 업로드한 음성 파일(Multipart)을 받아 CLOVA Speech로 STT 변환 후 텍스트 반환

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 음성-텍스트 변환 요청의 HTTP API 진입점이다.
 * 컨트롤러는 multipart HTTP 입력을 검증하고 STT 처리를 위임한다.
 * 웹 계층에 공급자 로직을 넣지 않고 ClovaSpeechClient로 위임한다.
 */
@RestController
@RequestMapping("/api/stt")
public class SttController {

    private static final Logger log = LoggerFactory.getLogger(SttController.class);

    private final ClovaSpeechClient clova;

    /**
     * STT 제공자 클라이언트를 생성자 주입으로 받는다.
     */
    public SttController(ClovaSpeechClient clova) {
        this.clova = clova;
    }

    /**
     * 업로드된 오디오를 CLOVA Speech를 통해 정규화된 텍스트로 변환한다.
     */
    @PostMapping(value = "/recognize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> recognize(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "language", required = false, defaultValue = "ko-KR") String language
    ) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "업로드된 음성 파일이 비어 있습니다."
                ));
            }

            log.info("[STT controller] request fileName={}, contentType={}, size={}, language={}",
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize(),
                    language
            );

            String text = clova.recognize(
                    file.getBytes(),
                    file.getOriginalFilename(),
                    file.getContentType(),
                    language
            );

            String normalized = text == null ? "" : text.trim();

            if (normalized.isBlank()) {
                log.warn("[STT controller] empty text returned from clova");
                return ResponseEntity.internalServerError().body(Map.of(
                        "message", "STT 결과가 비어 있습니다."
                ));
            }

            log.info("[STT controller] success textLength={}", normalized.length());

            return ResponseEntity.ok(Map.of(
                    "text", normalized
            ));
        } catch (Exception e) {
            log.error("[STT controller] recognize failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", e.getMessage() == null ? "STT 처리 중 오류가 발생했습니다." : e.getMessage()
            ));
        }
    }
}
