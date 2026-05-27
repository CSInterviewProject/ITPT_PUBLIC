// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.exception;

// 위치: src/main/java/com/itpt/api/global/exception/ErrorCode.java
// 역할: 프로젝트 동작에 필요한 구성 요소

import org.springframework.http.HttpStatus;

/**
 * 에러 코드 표준 정의.
 *
 * 한 곳에서 "상태코드/에러코드/메시지"를 묶어두면
 * - 예외 처리 일관성이 생기고
 * - 프론트는 code 기준으로 분기하기 쉬워진다.
 */
public enum ErrorCode {

    // 공통
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "서버 내부 오류입니다."),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "잘못된 요청입니다."),

    // ✅ 추가: 인증/인가 (JWT 공통)
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "인증이 필요합니다."), // 401
    FORBIDDEN(HttpStatus.FORBIDDEN, "FORBIDDEN", "접근 권한이 없습니다."),        // 403
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "토큰이 유효하지 않습니다."),

    // 질문
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "QUESTION_NOT_FOUND", "질문을 찾을 수 없습니다."),
    QUESTION_EMPTY(HttpStatus.NOT_FOUND, "QUESTION_EMPTY", "조건에 맞는 질문이 없습니다."),

    // 회원/인증
    USER_EMAIL_EXISTS(HttpStatus.CONFLICT, "USER_EMAIL_EXISTS", "이미 가입된 이메일입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "INVALID_PASSWORD", "비밀번호가 일치하지 않습니다."),
    PASSWORD_POLICY_VIOLATION(HttpStatus.BAD_REQUEST, "PASSWORD_POLICY_VIOLATION", "비밀번호는 8자 이상이며 특수문자를 1개 이상 포함해야 합니다."),
    PASSWORD_CHANGE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "PASSWORD_CHANGE_NOT_ALLOWED", "소셜 로그인 전용 계정은 비밀번호를 변경할 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public String getMessage() { return message; }
}
