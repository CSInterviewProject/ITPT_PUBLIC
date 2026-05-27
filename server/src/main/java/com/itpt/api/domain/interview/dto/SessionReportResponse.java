// 파일 목적: session report response용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * SessionReportResponse DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@AllArgsConstructor
public class SessionReportResponse {
    private Long sessionId;
    private String topic;
    private int totalTurns;
    private double averageScore;

    // 간단 요약: 세션 결과를 텍스트로 제공
    private String summary;
    private List<String> strengths;
    private List<String> improvements;

    private List<SessionTurnItem> turns;
}
