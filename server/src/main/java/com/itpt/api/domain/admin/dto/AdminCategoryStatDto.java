// 파일 목적: admin category stat dto용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.admin.dto;

// 위치: src/main/java/com/itpt/api/domain/admin/dto/AdminCategoryStatDto.java
// 역할: 면접 기록 탭 카테고리별 평균 점수 차트용 DTO

import lombok.Getter;

/**
 * AdminCategoryStatDto DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
@Getter
public class AdminCategoryStatDto {

    private final String topic;
    private final int count;    // 해당 카테고리 턴(답변) 수
    private final int avgScore; // 해당 카테고리 평균 점수

    // 함수 목적: AdminCategoryStatDto를 생성한다.
    public AdminCategoryStatDto(String topic, int count, int avgScore) {
        this.topic    = topic;
        this.count    = count;
        this.avgScore = avgScore;
    }
}
