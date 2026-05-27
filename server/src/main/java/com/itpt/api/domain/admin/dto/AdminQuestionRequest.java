// 파일 목적: admin question request용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.admin.dto;

// 위치: src/main/java/com/itpt/api/domain/admin/dto/AdminQuestionRequest.java
// 역할: 관리자 질문 추가/수정 요청 DTO

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AdminQuestionRequest DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
@NoArgsConstructor
public class AdminQuestionRequest {
    private String topic;
    private String subtopic;
    private int difficulty;          // 1~5
    private String questionText;
    private String modelAnswer;
    private List<String> requiredKeywords;
    private List<String> optionalKeywords;
}