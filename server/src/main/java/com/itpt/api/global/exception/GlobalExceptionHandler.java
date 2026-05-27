// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.exception;

// 위치: src/main/java/com/itpt/api/global/exception/GlobalExceptionHandler.java
// 역할: 전역 예외 처리 + 공통 에러 응답 + 시스템 로그 저장
// 연결/흐름:
// Controller/Service에서 예외 발생
//   → GlobalExceptionHandler가 예외 가로챔
//   → 서버 로그(log.error / log.warn) 기록
//   → SystemLogService로 관리자용 로그 저장
//   → 프론트에는 ApiErrorResponse 형태로 통일 응답

import com.itpt.api.domain.admin.systemlog.SystemLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;

@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {

    private final SystemLogService systemLogService;

    /**
     * 서비스 계층에서 의도적으로 던진 비즈니스 예외 처리
     * 예:
     * - QUESTION_NOT_FOUND
     * - USER_EMAIL_EXISTS
     * - INVALID_PASSWORD
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException e) {
        ErrorCode ec = e.getErrorCode();

        log.warn("ApiException: code={}, message={}", ec.getCode(), ec.getMessage());

        systemLogService.write(
                "WARN",
                "SYSTEM",
                ec.getCode(),
                ec.getMessage(),
                null
        );

        return ResponseEntity
                .status(ec.getStatus())
                .body(new ApiErrorResponse(ec.getCode(), ec.getMessage()));
    }

    /**
     * @Valid 검증 실패 처리
     * DTO 필드 누락/형식 오류 등을 한 곳에서 처리
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        String details = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        log.warn("Validation failed: {}", details);

        systemLogService.write(
                "WARN",
                "SYSTEM",
                "VALIDATION_ERROR",
                details.isBlank() ? "요청값 검증 실패" : details,
                null
        );

        ErrorCode ec = ErrorCode.BAD_REQUEST;
        return ResponseEntity
                .status(ec.getStatus())
                .body(new ApiErrorResponse("VALIDATION_ERROR", details.isBlank() ? ec.getMessage() : details));
    }

    /**
     * JSON 파싱 실패
     * 예:
     * - 잘못된 JSON 형식
     * - enum/number/date 타입 변환 실패
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleMessageNotReadable(HttpMessageNotReadableException e) {
        log.warn("Request body parse failed", e);

        systemLogService.write(
                "WARN",
                "SYSTEM",
                "MALFORMED_JSON",
                "요청 본문(JSON) 파싱 실패",
                null
        );

        ErrorCode ec = ErrorCode.BAD_REQUEST;
        return ResponseEntity
                .status(ec.getStatus())
                .body(new ApiErrorResponse("MALFORMED_JSON", "요청 본문 형식이 올바르지 않습니다."));
    }

    /**
     * 지원하지 않는 HTTP Method 호출
     * 예: GET만 열려 있는데 POST로 호출한 경우
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("Method not supported: {}", e.getMessage());

        systemLogService.write(
                "WARN",
                "SYSTEM",
                "METHOD_NOT_ALLOWED",
                e.getMessage(),
                null
        );

        return ResponseEntity
                .status(405)
                .body(new ApiErrorResponse("METHOD_NOT_ALLOWED", "지원하지 않는 HTTP 메서드입니다."));
    }

    /**
     * 인증은 되었지만 권한이 없는 경우
     * 예: 일반 사용자가 관리자 API 접근
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException e) {
        log.warn("Access denied: {}", e.getMessage());

        systemLogService.write(
                "WARN",
                "SECURITY",
                "FORBIDDEN",
                "접근 권한이 없습니다.",
                null
        );

        ErrorCode ec = ErrorCode.FORBIDDEN;
        return ResponseEntity
                .status(ec.getStatus())
                .body(new ApiErrorResponse(ec.getCode(), ec.getMessage()));
    }

    /**
     * IllegalArgumentException 처리
     * 잘못된 파라미터, 잘못된 상태값 등에서 자주 발생
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("Illegal argument: {}", e.getMessage());

        systemLogService.write(
                "WARN",
                "SYSTEM",
                "ILLEGAL_ARGUMENT",
                e.getMessage() == null ? "잘못된 요청 인자입니다." : e.getMessage(),
                null
        );

        ErrorCode ec = ErrorCode.BAD_REQUEST;
        return ResponseEntity
                .status(ec.getStatus())
                .body(new ApiErrorResponse("ILLEGAL_ARGUMENT",
                        e.getMessage() == null ? ec.getMessage() : e.getMessage()));
    }

    /**
     * 그 외 예상하지 못한 모든 예외
     * 반드시 스택트레이스를 서버 로그에 남기고,
     * 관리자 시스템 로그에도 기록한다.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleException(Exception e) {
        log.error("Unhandled exception", e);

        systemLogService.write(
                "ERROR",
                "SYSTEM",
                "UNHANDLED_EXCEPTION",
                e.getClass().getSimpleName() + ": " + (e.getMessage() == null ? "no message" : e.getMessage()),
                null
        );

        ErrorCode ec = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity
                .status(ec.getStatus())
                .body(new ApiErrorResponse(ec.getCode(), ec.getMessage()));
    }
}