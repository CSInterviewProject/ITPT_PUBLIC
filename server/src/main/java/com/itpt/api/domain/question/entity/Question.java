// 파일 목적: question 도메인 엔티티 모델을 정의한다.
package com.itpt.api.domain.question.entity;

// 위치: src/main/java/com/itpt/api/domain/question/entity/Question.java
// 역할: DB 테이블과 매핑되는 JPA 엔티티 정의

import jakarta.persistence.*;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String topic;

    private String subtopic;

    @Column(nullable = false)
    private int difficulty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String modelAnswer;

    @ElementCollection
    @CollectionTable(name = "question_required_keywords", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "keyword")
    private List<String> requiredKeywords = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "question_optional_keywords", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "keyword")
    private List<String> optionalKeywords = new ArrayList<>();

    protected Question() {}

    public Question(String topic, String subtopic, int difficulty, String questionText, String modelAnswer,
                    List<String> requiredKeywords, List<String> optionalKeywords) {
        this.topic = topic;
        this.subtopic = subtopic;
        this.difficulty = difficulty;
        this.questionText = questionText;
        this.modelAnswer = modelAnswer;
        if (requiredKeywords != null) this.requiredKeywords = requiredKeywords;
        if (optionalKeywords != null) this.optionalKeywords = optionalKeywords;
    }

    // ✅ 추가: 관리자 질문 수정용 메서드
    public void update(String topic, String subtopic, int difficulty, String questionText,
                       String modelAnswer, List<String> requiredKeywords, List<String> optionalKeywords) {
        this.topic = topic;
        this.subtopic = subtopic;
        this.difficulty = difficulty;
        this.questionText = questionText;
        this.modelAnswer = modelAnswer;
        this.requiredKeywords = requiredKeywords != null ? requiredKeywords : new ArrayList<>();
        this.optionalKeywords = optionalKeywords != null ? optionalKeywords : new ArrayList<>();
    }
}