// 파일 목적: interview turn request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.interview.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * InterviewTurnRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@Setter
public class InterviewTurnRequest {

    // ✅ 세션 기반이면 프론트에서 같이 보냄 (InterviewTurnController가 사용)
    private Long sessionId;

    // 현재 질문 id (DB 질문이면 양수, 생성형 꼬리질문이면 null/음수일 수 있음)
    private Long questionId;

    // OS/NETWORK/DB/SPRING 등
    private String topic;

    // STT 결과 텍스트
    private String transcript;

    // ✅ 생성형 질문(꼬리질문)일 때 DB에 없으므로 프론트가 같이 보내야 정확히 평가 가능
    private String questionText;
    private String modelAnswer;
    private List<String> requiredKeywords;
    private List<String> optionalKeywords;

    // 선택(없어도 됨)
    private Integer difficulty;
    private Boolean generated;
}
