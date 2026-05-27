// 위치: server/src/main/java/com/itpt/api/global/bootstrap/QuestionSeedRunner.java
// 파일 목적: 이 파일의 역할을 정의한다.
package com.itpt.api.global.bootstrap;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itpt.api.domain.question.entity.Question;
import com.itpt.api.domain.question.repository.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 앱 실행 시 classpath의 seeds/*.json을 읽어 DB에 초기 질문 데이터를 넣는 Runner.
 * topic별로 이미 데이터가 있으면 중복 삽입하지 않고 스킵한다.
 */
@Component
public class QuestionSeedRunner implements CommandLineRunner {

    private final ObjectMapper objectMapper;
    private final QuestionRepository questionRepository;

    // 함수 목적: QuestionSeedRunner를 생성한다.
    public QuestionSeedRunner(ObjectMapper objectMapper, QuestionRepository questionRepository) {
        this.objectMapper = objectMapper;
        this.questionRepository = questionRepository;
    }

    // 함수 목적: run 로직을 구현한다.
    @Override
    public void run(String... args) throws Exception {
        // seeds 폴더에 있는 파일들(원하는 만큼 추가/삭제 가능)
        List<String> seedFiles = List.of(
                "os.json",
                "network.json",
                "db.json",
                "java.json",
                "spring.json",
                "data-structure.json",
                "jpa.json",
                "c.json",
                "cpp.json",
                "python.json"
        );

        for (String fileName : seedFiles) {
            seedFromFile(fileName);
        }
    }

    // 함수 목적: seed from file 로직을 구현한다.
    private void seedFromFile(String fileName) throws Exception {
        ClassPathResource resource = new ClassPathResource("seeds/" + fileName);
        if (!resource.exists()) return;

        try (InputStream is = resource.getInputStream()) {
            List<SeedItem> items = objectMapper.readValue(is, new TypeReference<List<SeedItem>>() {});
            if (items == null || items.isEmpty()) return;

            Map<String, List<SeedItem>> byTopic = items.stream()
                    .collect(Collectors.groupingBy(i -> normalizeTopic(i.topic)));

            for (Map.Entry<String, List<SeedItem>> entry : byTopic.entrySet()) {
                String topic = entry.getKey();

                long count = questionRepository.countByTopic(topic);
                if (count > 0) continue;

                List<Question> toSave = new ArrayList<>();
                for (SeedItem item : entry.getValue()) {
                    String modelAnswer = buildModelAnswer(item.answer);
                    List<String> required = (item.keywords != null && item.keywords.required != null)
                            ? item.keywords.required : List.of();
                    List<String> optional = (item.keywords != null && item.keywords.optional != null)
                            ? item.keywords.optional : List.of();

                    toSave.add(new Question(
                            topic,
                            item.subtopic,
                            item.difficulty,
                            item.question,
                            modelAnswer,
                            required,
                            optional
                    ));
                }
                questionRepository.saveAll(toSave);
            }
        }
    }

    /**
     * topic 표기를 DB 저장 표준값으로 통일한다.
     */
    private String normalizeTopic(String topic) {
        if (topic == null) return "OS";
        String t = topic.trim();

        if (t.equalsIgnoreCase("os")) return "OS";
        if (t.equalsIgnoreCase("network")) return "Network";
        if (t.equalsIgnoreCase("db") || t.equalsIgnoreCase("database")) return "Database";
        if (t.equalsIgnoreCase("java")) return "Java";
        if (t.equalsIgnoreCase("spring")) return "Spring";
        if (t.equalsIgnoreCase("jpa")) return "JPA";
        if (t.equalsIgnoreCase("data structure") || t.equalsIgnoreCase("data-structure")) return "DataStructure";
        if (t.equals("C")) return "C";
        if (t.equalsIgnoreCase("c++")) return "C++";
        if (t.equalsIgnoreCase("python")) return "Python";

        return t;
    }

    // 함수 목적: model answer를 구성한다.
    private String buildModelAnswer(Answer answer) {
        if (answer == null) return null;

        StringBuilder sb = new StringBuilder();

        if (answer.text != null && !answer.text.isBlank()) {
            sb.append(answer.text.trim());
        }

        if (answer.bullets != null && !answer.bullets.isEmpty()) {
            if (sb.length() > 0) sb.append("\n\n");
            for (String b : answer.bullets) {
                sb.append("- ").append(b).append("\n");
            }
        }

        String result = sb.toString().trim();
        return result.isBlank() ? null : result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class SeedItem {
        public String id;
        public String topic;
        public String subtopic;
        public int difficulty;
        public String question;
        public Answer answer;
        public Keywords keywords;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Answer {
        public String text;
        public List<String> bullets;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Keywords {
        public List<String> required;
        public List<String> optional;
    }
}
