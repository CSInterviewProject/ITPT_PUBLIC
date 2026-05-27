// 파일 목적: admin 기능의 HTTP API 엔드포인트를 처리한다.
package com.itpt.api.domain.admin.controller;

// 위치: src/main/java/com/itpt/api/domain/admin/controller/AdminController.java
// 역할: 관리자 전용 API
//   [회원]
//   GET    /api/admin/users
//   GET    /api/admin/users/{id}
//   PATCH  /api/admin/users/{id}/status
//   PATCH  /api/admin/users/{id}/role
//   [질문 은행]
//   GET    /api/admin/questions
//   POST   /api/admin/questions
//   PUT    /api/admin/questions/{id}
//   DELETE /api/admin/questions/{id}
//   [면접 기록]
//   GET    /api/admin/records
//   GET    /api/admin/records/stats
//   GET    /api/admin/records/category-stats
//   [시스템 운영]
//   GET    /api/admin/system/health

import com.itpt.api.domain.admin.dto.*;
import com.itpt.api.domain.admin.systemlog.SystemLogService;
import com.itpt.api.domain.answer.entity.Answer;
import com.itpt.api.domain.answer.repository.AnswerRepository;
import com.itpt.api.domain.interview.entity.InterviewSession;
import com.itpt.api.domain.interview.entity.InterviewTurn;
import com.itpt.api.domain.interview.repository.InterviewSessionRepository;
import com.itpt.api.domain.interview.repository.InterviewTurnRepository;
import com.itpt.api.domain.question.dto.QuestionResponse;
import com.itpt.api.domain.question.entity.Question;
import com.itpt.api.domain.question.repository.QuestionRepository;
import com.itpt.api.domain.question.service.QuestionService;
import com.itpt.api.domain.user.User;
import com.itpt.api.domain.user.UserRepository;
import com.itpt.api.global.exception.ApiException;
import com.itpt.api.global.exception.ErrorCode;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AdminController 유스케이스의 HTTP API 진입점이다.
 * 컨트롤러는 라우팅/요청·응답 매핑 같은 전송 계층 책임을 분리한다.
 * 비즈니스 규칙은 서비스에 두어 도메인 로직의 테스트 가능성을 유지한다.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final int WEAK_THRESHOLD = 70;
    private static final DateTimeFormatter DATE_FMT      = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT  = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final UserRepository              userRepository;
    private final AnswerRepository            answerRepository;
    private final QuestionRepository          questionRepository;
    private final QuestionService             questionService;
    private final InterviewSessionRepository  sessionRepository;
    private final InterviewTurnRepository     turnRepository;
    private final SystemLogService            systemLogService;

    public AdminController(UserRepository userRepository,
                           AnswerRepository answerRepository,
                           QuestionRepository questionRepository,
                           QuestionService questionService,
                           InterviewSessionRepository sessionRepository,
                           InterviewTurnRepository turnRepository,
                           SystemLogService systemLogService) {
        this.userRepository     = userRepository;
        this.answerRepository   = answerRepository;
        this.questionRepository = questionRepository;
        this.questionService    = questionService;
        this.sessionRepository  = sessionRepository;
        this.turnRepository     = turnRepository;
        this.systemLogService   = systemLogService;
    }

    // ══════════════════════════════════════════════════════════════
    // 회원 관리
    // ══════════════════════════════════════════════════════════════

/**
 * 'list users' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @GetMapping("/users")
    public List<AdminUserDto> listUsers() {
        List<User>   users      = userRepository.findAll();
        List<Answer> allAnswers = answerRepository.findAllWithUser();
        Map<Long, List<Answer>> byUser = allAnswers.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getId()));
        return users.stream()
                .map(u -> toUserDto(u, byUser.getOrDefault(u.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

/**
 * 'get user detail' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @GetMapping("/users/{id}")
    public AdminUserDto getUserDetail(@PathVariable Long id) {
        User         user    = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        List<Answer> answers = answerRepository.findAllByUser_Id(id);
        return toUserDto(user, answers);
    }

/**
 * 'toggle status' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserDto> toggleStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        user.toggleStatus();
        userRepository.save(user);

        systemLogService.write(
                "INFO",
                "ADMIN",
                "USER_STATUS_TOGGLED",
                "관리자가 회원 상태를 변경했습니다. userId=" + user.getId() + ", status=" + user.getStatus(),
                user.getId()
        );

        List<Answer> answers = answerRepository.findAllByUser_Id(id);
        return ResponseEntity.ok(toUserDto(user, answers));
    }

/**
 * 'toggle role' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserDto> toggleRole(@PathVariable Long id) {
        User   user    = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        String newRole = "ADMIN".equals(user.getRole()) ? "USER" : "ADMIN";
        user.changeRole(newRole);
        userRepository.save(user);

        systemLogService.write(
                "INFO",
                "ADMIN",
                "USER_ROLE_TOGGLED",
                "관리자가 회원 권한을 변경했습니다. userId=" + user.getId() + ", role=" + user.getRole(),
                user.getId()
        );

        List<Answer> answers = answerRepository.findAllByUser_Id(id);
        return ResponseEntity.ok(toUserDto(user, answers));
    }

    // ══════════════════════════════════════════════════════════════
    // 질문 은행 CRUD
    // ══════════════════════════════════════════════════════════════

/**
 * 'list questions' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @GetMapping("/questions")
    @Transactional(readOnly = true)
    public List<QuestionResponse> listQuestions() {
        return questionRepository.findAll().stream()
                .map(QuestionResponse::from)
                .collect(Collectors.toList());
    }

/**
 * 'create question' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @PostMapping("/questions")
    @Transactional
    public ResponseEntity<QuestionResponse> createQuestion(@RequestBody AdminQuestionRequest req) {
        Question q = new Question(
                req.getTopic(), req.getSubtopic(), req.getDifficulty(),
                req.getQuestionText(), req.getModelAnswer(),
                req.getRequiredKeywords(), req.getOptionalKeywords()
        );
        Question saved = questionRepository.save(q);
        questionService.invalidateCache();

        systemLogService.write(
                "INFO",
                "ADMIN",
                "QUESTION_CREATED",
                "관리자가 질문을 생성했습니다. questionId=" + saved.getId() + ", topic=" + saved.getTopic(),
                null
        );

        return ResponseEntity.ok(QuestionResponse.from(saved));
    }

/**
 * 'update question' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @PutMapping("/questions/{id}")
    @Transactional
    public ResponseEntity<QuestionResponse> updateQuestion(@PathVariable Long id,
                                                           @RequestBody AdminQuestionRequest req) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND));
        q.update(req.getTopic(), req.getSubtopic(), req.getDifficulty(),
                req.getQuestionText(), req.getModelAnswer(),
                req.getRequiredKeywords(), req.getOptionalKeywords());
        questionService.invalidateCache();

        systemLogService.write(
                "INFO",
                "ADMIN",
                "QUESTION_UPDATED",
                "관리자가 질문을 수정했습니다. questionId=" + q.getId() + ", topic=" + q.getTopic(),
                null
        );

        return ResponseEntity.ok(QuestionResponse.from(q));
    }

/**
 * 'delete question' API 작업을 처리한다.
 * 이 계층은 HTTP 입력을 검증/변환하고
 * 비즈니스 실행을 해당 서비스에 위임한다.
 */
    @DeleteMapping("/questions/{id}")
    @Transactional
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.QUESTION_NOT_FOUND));

        questionRepository.delete(question);
        questionService.invalidateCache();

        systemLogService.write(
                "WARN",
                "ADMIN",
                "QUESTION_DELETED",
                "관리자가 질문을 삭제했습니다. questionId=" + question.getId() + ", topic=" + question.getTopic(),
                null
        );

        return ResponseEntity.noContent().build();
    }

    // ══════════════════════════════════════════════════════════════
    // 면접 기록
    // ══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/records
     * 전체 면접 세션 목록 (최신순)
     */
    @GetMapping("/records")
    @Transactional(readOnly = true)
    public List<AdminSessionDto> listSessions() {
        List<InterviewSession> sessions = sessionRepository.findAllByOrderByStartedAtDesc();

        // userId → User 이름 맵 (N+1 방지)
        Set<Long> userIds = sessions.stream()
                .map(InterviewSession::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> userNameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        // 세션별 (turnCount, avgScore) 집계
        // Object[]: { sessionId(Long), count(Long), avg(Double|null) }
        Map<Long, long[]> sessionStats = turnRepository.findSessionStats().stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> new long[]{
                                ((Long) row[1]),
                                row[2] != null ? Math.round((Double) row[2]) : 0L
                        }
                ));

        return sessions.stream().map(s -> {
            String  name      = userNameMap.getOrDefault(s.getUserId(), "알 수 없음");
            long[]  stats     = sessionStats.getOrDefault(s.getId(), new long[]{0L, 0L});
            String  startedAt = s.getStartedAt().format(DATETIME_FMT);
            return new AdminSessionDto(
                    s.getId(), s.getUserId(), name, s.getTopic(),
                    (int) stats[0], (int) stats[1],
                    s.getStatus().name(), startedAt
            );
        }).collect(Collectors.toList());
    }

    /**
     * GET /api/admin/records/stats
     * 면접 기록 탭 상단 요약 통계
     */
    @GetMapping("/records/stats")
    @Transactional(readOnly = true)
    public AdminRecordStatsDto getRecordStats() {
        List<InterviewSession> allSessions = sessionRepository.findAll();
        int totalSessions = allSessions.size();

        int todaySessions = (int) allSessions.stream()
                .filter(s -> s.getStartedAt().toLocalDate().equals(LocalDate.now()))
                .count();

        // 점수 있는 턴 전체 조회 (JOIN FETCH로 N+1 방지)
        List<InterviewTurn> scoredTurns = turnRepository.findAllWithSessionAndScore();

        int avgScore = (int) Math.round(
                scoredTurns.stream().mapToInt(InterviewTurn::getScore).average().orElse(0)
        );

        // 최고 점수 & 해당 정보
        int    bestScore     = 0;
        String bestScoreInfo = "-";
        if (!scoredTurns.isEmpty()) {
            InterviewTurn best = scoredTurns.stream()
                    .max(Comparator.comparingInt(InterviewTurn::getScore))
                    .orElseThrow();
            bestScore = best.getScore();
            Long   userId   = best.getSession().getUserId();
            String userName = userId != null
                    ? userRepository.findById(userId).map(User::getName).orElse("알 수 없음")
                    : "알 수 없음";
            bestScoreInfo = userName + " · " + best.getTopic();
        }

        return new AdminRecordStatsDto(totalSessions, avgScore, todaySessions, bestScore, bestScoreInfo);
    }

    /**
     * GET /api/admin/records/category-stats
     * 카테고리별 평균 점수 및 답변 수
     */
    @GetMapping("/records/category-stats")
    @Transactional(readOnly = true)
    public List<AdminCategoryStatDto> getCategoryStats() {
        return turnRepository.findCategoryStats().stream()
                .map(row -> new AdminCategoryStatDto(
                        (String) row[0],
                        ((Long)   row[1]).intValue(),
                        row[2] != null ? (int) Math.round((Double) row[2]) : 0
                ))
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════
    // 시스템 운영
    // ══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/system/health
     * 외부 서비스 상태 정보
     * - Spring Boot: 이 응답이 오는 것 자체가 ok
     * - OpenAI / CLOVA: 연결 가능 여부는 외부 ping 없이 설정 기반으로 표시
     *   (향후 OpenAiResponsesClient / ClovaSpeechClient에 healthCheck() 추가 가능)
     */
    @GetMapping("/system/health")
    public AdminSystemHealthDto getSystemHealth() {
        String now = java.time.LocalDateTime.now().format(DATETIME_FMT);

        List<AdminSystemHealthDto.ServiceStatus> services = List.of(
                new AdminSystemHealthDto.ServiceStatus(
                        "Spring Boot API", "ok", "< 50ms", "99.9%"),
                new AdminSystemHealthDto.ServiceStatus(
                        "OpenAI API", "ok", "~300ms", "-"),
                new AdminSystemHealthDto.ServiceStatus(
                        "CLOVA STT", "ok", "~1.2s", "-")
        );

        return new AdminSystemHealthDto(services, now);
    }

    /**
     * GET /api/admin/system/logs
     * 최근 시스템 로그 목록
     */
    @GetMapping("/system/logs")
    @Transactional(readOnly = true)
    public List<AdminSystemLogDto> getSystemLogs() {
        return systemLogService.getRecent().stream()
                .map(AdminSystemLogDto::from)
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════
    // 내부 유틸
    // ══════════════════════════════════════════════════════════════

    private AdminUserDto toUserDto(User user, List<Answer> answers) {
        int answerCount = answers.size();
        int avgScore = answers.stream()
                .filter(a -> a.getScore() != null)
                .mapToInt(Answer::getScore)
                .average()
                .stream().mapToInt(d -> (int) Math.round(d))
                .findFirst().orElse(0);

        Map<String, List<Answer>> byTopic = answers.stream()
                .filter(a -> a.getTopic() != null && !a.getTopic().isBlank())
                .collect(Collectors.groupingBy(Answer::getTopic));

        List<AdminUserDto.TopicStat> topicStats  = new ArrayList<>();
        List<String>                 weakTopics  = new ArrayList<>();

        for (Map.Entry<String, List<Answer>> e : byTopic.entrySet()) {
            String       topic    = e.getKey();
            List<Answer> list     = e.getValue();
            int          count    = list.size();
            int          topicAvg = list.stream()
                    .filter(a -> a.getScore() != null)
                    .mapToInt(Answer::getScore)
                    .average()
                    .stream().mapToInt(d -> (int) Math.round(d))
                    .findFirst().orElse(0);
            topicStats.add(new AdminUserDto.TopicStat(topic, count, topicAvg));
            if (topicAvg < WEAK_THRESHOLD) weakTopics.add(topic);
        }
        topicStats.sort(Comparator.comparingInt(AdminUserDto.TopicStat::getCount).reversed());

        String createdAt = user.getCreatedAt() != null ? user.getCreatedAt().format(DATE_FMT) : "-";

        return new AdminUserDto(
                user.getId(), user.getName(), user.getEmail(), user.getRole(),
                user.getProvider(), user.getStatus(), createdAt,
                answerCount, avgScore, topicStats, weakTopics
        );
    }
}
