// 파일 목적: api error response용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.global.exception;

// 위치: src/main/java/com/itpt/api/global/exception/ApiErrorResponse.java
// 역할: 프로젝트 동작에 필요한 구성 요소


import java.time.LocalDateTime;

/**
 * 에러 응답 DTO.
 *
 * DTO는 내부 구현과 독립적으로 오류 페이로드 형식을 표준화한다.
 * 예외 클래스 구조와 분리된 응답 형태를 유지한다.
 *
 * 프론트에서 공통으로 처리하기 쉽도록
 * { code, message, timestamp } 형태로 통일한다.
 *
 * - code: 프로그램이 분기하기 좋은 짧은 문자열(예: QUESTION_NOT_FOUND)
 * - message: 사용자/개발자에게 보여줄 설명
 * - timestamp: 디버깅/로그 매칭용
 */
public class ApiErrorResponse {

    private final String code;
    private final String message;
    private final LocalDateTime timestamp;

    // 함수 목적: ApiErrorResponse를 생성한다.
    public ApiErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    // 함수 목적: code를 반환한다.
    public String getCode() {
        return code;
    }

    // 함수 목적: message를 반환한다.
    public String getMessage() {
        return message;
    }

    // 함수 목적: timestamp를 반환한다.
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
