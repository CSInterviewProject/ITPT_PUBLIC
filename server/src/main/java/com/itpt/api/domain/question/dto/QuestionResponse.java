// 위치: server/src/main/java/com/itpt/api/domain/question/dto/QuestionResponse.java
// 파일 목적: question response용 API 데이터 전송 모델을 정의한다.
package com.itpt.api.domain.question.dto;

// 위치: src/main/java/com/itpt/api/domain/question/dto/QuestionResponse.java
// 역할: 요청/응답 데이터 전송 객체(DTO) 정의


import com.itpt.api.domain.question.entity.Question;
import java.util.List;

/**
 * QuestionResponse DTO 계약을 정의한다.
 * DTO를 사용해 안정적인 API 페이로드 형식을 유지한다.
 * 영속 엔티티가 외부 인터페이스로 직접 노출되지 않게 한다.
 */
public record QuestionResponse(
        Long id,
        String topic,
        String subtopic,
        int difficulty,
        String questionText,
        String modelAnswer,
        List<String> requiredKeywords,
        List<String> optionalKeywords
) {
    // 함수 목적: from 로직을 구현한다.
    public static QuestionResponse from(Question q) {
        // ✅ 핵심: LAZY 컬렉션을 새 List로 복사 -> 이 순간 트랜잭션 안에서 초기화됨
        List<String> req = (q.getRequiredKeywords() == null) ? List.of()
                : List.copyOf(q.getRequiredKeywords());
        List<String> opt = (q.getOptionalKeywords() == null) ? List.of()
                : List.copyOf(q.getOptionalKeywords());

        return new QuestionResponse(
                q.getId(),
                q.getTopic(),
                q.getSubtopic(),
                q.getDifficulty(),
                q.getQuestionText(),
                q.getModelAnswer(),
                req,
                opt
        );
    }
}
