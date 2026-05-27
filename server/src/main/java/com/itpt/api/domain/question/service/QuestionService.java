// 파일 목적: question 애플리케이션 서비스 로직을 구현한다.
package com.itpt.api.domain.question.service;

import com.itpt.api.domain.question.dto.QuestionResponse;
import com.itpt.api.domain.question.entity.Question;
import com.itpt.api.domain.question.repository.QuestionRepository;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * QuestionService 도메인 워크플로를 담당하는 애플리케이션 서비스다.
 * 서비스는 도메인 규칙과 컴포넌트 간 호출을 오케스트레이션한다.
 * 컨트롤러는 얇게 유지하고 리포지토리는 영속성에 집중하도록 한다.
 */
@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;

    private final ConcurrentHashMap<String, List<Long>> questionIdCache = new ConcurrentHashMap<>();

/**
 * 'get questions' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public List<Question> getQuestions(String topic, int size) {
        return questionRepository.findByTopic(topic, PageRequest.of(0, size)).getContent();
    }

/**
 * 'get by id' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public QuestionResponse getById(Long id) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND));
        return QuestionResponse.from(q);
    }

/**
 * 'get random by topic' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public QuestionResponse getRandomByTopic(String topic, Integer difficulty) {
        List<Long> ids = getCachedQuestionIds(topic, difficulty);
        if (ids.isEmpty()) {
            throw new ApiException(ErrorCode.QUESTION_EMPTY);
        }

        int randomIndex = ThreadLocalRandom.current().nextInt(ids.size());
        Long questionId = ids.get(randomIndex);

        Question q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_EMPTY));
        return QuestionResponse.from(q);
    }

/**
 * 'get random by topic' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    public QuestionResponse getRandomByTopic(String topic) {
        return getRandomByTopic(topic, null);
    }

/**
 * 'invalidate cache' 애플리케이션 워크플로를 수행한다.
 * 비즈니스 오케스트레이션을 한 곳에 모아
 * 전송 계층(컨트롤러)과 저장소 계층(리포지토리) 책임에서 분리한다.
 */
    @Transactional
    public void invalidateCache() {
        questionIdCache.clear();
    }

    // 함수 목적: cached question ids를 반환한다.
    private List<Long> getCachedQuestionIds(String topic, Integer difficulty) {
        String normalizedTopic = topic == null ? "" : topic.trim();
        boolean useDifficulty = difficulty != null && difficulty > 0;
        String key = normalizedTopic + "|" + (useDifficulty ? difficulty : 0);

        return questionIdCache.computeIfAbsent(key, unused -> {
            if (normalizedTopic.isBlank()) {
                return List.of();
            }
            if (useDifficulty) {
                return List.copyOf(questionRepository.findIdsByTopicAndDifficulty(normalizedTopic, difficulty));
            }
            return List.copyOf(questionRepository.findIdsByTopic(normalizedTopic));
        });
    }
}
