// 파일 목적: history chat response용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.history.dto;

/**
 * HistoryChatResponse DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
public class HistoryChatResponse {
    private final Long answerId;
    private final String answer;

    // 함수 목적: HistoryChatResponse를 생성한다.
    public HistoryChatResponse(Long answerId, String answer) {
        this.answerId = answerId;
        this.answer = answer;
    }

    // 함수 목적: answer id를 반환한다.
    public Long getAnswerId() {
        return answerId;
    }

    // 함수 목적: answer를 반환한다.
    public String getAnswer() {
        return answer;
    }
}
