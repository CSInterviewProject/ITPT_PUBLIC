// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.exception;

// 위치: src/main/java/com/itpt/api/global/exception/ApiException.java
// 역할: 프로젝트 동작에 필요한 구성 요소


/**
 * 서비스 계층에서 "의도적으로" 던지는 도메인 예외.
 *
 * 왜 RuntimeException인가?
 * - 스프링 트랜잭션 롤백 기본 정책이 RuntimeException에 잘 맞고
 * - 호출부에 throws를 강제하지 않아 코드가 과도하게 복잡해지지 않음
 *
 * ErrorCode를 들고 다니게 해서
 * - HTTP Status
 * - 에러 코드 문자열
 * - 사용자에게 보여줄 메시지
 * 를 한 번에 표준화한다.
 */
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    // 함수 목적: ApiException를 생성한다.
    public ApiException(ErrorCode errorCode) {
        // 부모 예외 메시지로도 남겨 디버깅 시 원인을 바로 확인할 수 있게 함
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    // 함수 목적: error code를 반환한다.
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
