// 파일 목적: api 공용 헬퍼 로직을 포함한다.
// 위치: src/lib/api.ts
// 역할: API 호출 + 공용 유틸

// =========================================================
// JWT: Bearer 토큰 헤더 유틸
// =========================================================
import axios from "axios";

// 역할: 프론트엔드에서 백엔드 인증복구 API(아이디 찾기/비밀번호 재설정)를 호출하기 위한 함수들을 정의한다.
export const sendFindIdCode = (name: string, email: string) =>
  axios.post("/api/auth/recovery/find-id/send-code", { name, email });

// 함수 목적: verify find id code 로직을 구현한다.
export const verifyFindIdCode = (email: string, code: string) =>
  axios.post("/api/auth/recovery/find-id/verify", { email, code });

// 함수 목적: find id 로직을 구현한다.
export const findId = (name: string, email: string) =>
  axios.post("/api/auth/recovery/find-id", { name, email });

// 함수 목적: send reset password code 로직을 구현한다.
export const sendResetPasswordCode = (email: string) =>
  axios.post("/api/auth/recovery/reset-password/send-code", { email });

// 함수 목적: verify reset password code 로직을 구현한다.
export const verifyResetPasswordCode = (email: string, code: string) =>
  axios.post("/api/auth/recovery/reset-password/verify", { email, code });

// 함수 목적: reset password 로직을 구현한다.
export const resetPassword = (email: string, newPassword: string) =>
  axios.post("/api/auth/recovery/reset-password", { email, newPassword });

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

// 함수 목적: change password 로직을 구현한다.
export async function changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
  const res = await fetch('/api/users/me/password', {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? '비밀번호 변경에 실패했습니다.');
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || '비밀번호 변경에 실패했습니다.');
  }

  return res.json();
}

// 함수 목적: access token를 반환한다.
export function getAccessToken(): string | null {
  const raw = localStorage.getItem('accessToken');
  if (!raw) return null;
  return raw.replace(/\s+/g, '');
}

// 함수 목적: auth headers 로직을 구현한다.
export function authHeaders(extra?: Record<string, string>) {
  const token = getAccessToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// =========================================================
// Topic 매핑
// =========================================================

/**
 * 대주제 카테고리 키 타입
 * - 프로그래밍 언어는 세부 언어(Java/C/C++/Python) 각각을 직접 category로 사용
 */
export type TopicKey =
    | 'os'
    | 'Network'
    | 'Database'
    | 'DataStructure'
    | 'Java'
    | 'C'
    | 'C++'
    | 'Python'
    | 'Spring'
    | 'JPA';

/**
 * 프론트(UI 표기) → 서버(Question.topic) 매핑.
 */
export function mapTopicToServer(topic: TopicKey | string): string {
  const t = String(topic).trim();

  if (t === 'os' || t === 'OS') return 'OS';
  if (t === '자료구조' || t === 'DataStructure') return 'DataStructure';
  if (t === 'JPA' || t === 'jpa') return 'JPA';

  // Java, C, C++, Python, Spring, Network, Database → 그대로 전달
  return t;
}

export type StoredUser = {
  id: number;
  email: string;
  name: string;
  role?: 'USER' | 'ADMIN';
};

// 함수 목적: stored user를 반환한다.
export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export type DashboardSummary = {
  averageScore: number;
  totalAnswers: number;
  level: number;
  topicStats: Array<{ topic: string; count: number; averageScore: number }>;
};

// 함수 목적: API에서 dashboard summary를 조회한다.
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`/api/dashboard/summary`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load dashboard summary');
  return res.json();
}

export type ServerQuestion = {
  id: number;
  topic: string;
  subtopic: string;
  difficulty: number;
  questionText: string;
  modelAnswer: string;
  requiredKeywords: string[];
  optionalKeywords: string[];
};

// 함수 목적: API에서 random question를 조회한다.
export async function fetchRandomQuestion(
    topic: string,
    difficulty?: number | null
): Promise<ServerQuestion> {
  const serverTopic = mapTopicToServer(topic);

  const q = new URLSearchParams({ topic: serverTopic });
  if (difficulty && difficulty > 0) q.append('difficulty', String(difficulty));

  const res = await fetch(`/api/questions/random?${q.toString()}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to load random question: ${res.status}`);
  return res.json();
}

export type CreateAnswerRequest = {
  questionId: number;
  topic?: string;
  userAnswer: string;
  score?: number;
  feedback?: string;
};

// 함수 목적: post answer 로직을 구현한다.
export async function postAnswer(payload: CreateAnswerRequest) {
  const res = await fetch('/api/answers', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save answer');
  return res.json();
}

export type AnswerItem = {
  id: number;
  userId: number;
  questionId: number;
  questionText: string;
  topic: string;
  userAnswer: string;
  score: number;
  feedback: string;
  createdAt: string;
};

// 함수 목적: API에서 recent answers를 조회한다.
export async function fetchRecentAnswers(): Promise<AnswerItem[]> {
  const res = await fetch(`/api/answers/recent`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load recent answers');
  return res.json();
}

export type HistoryChatRequest = {
  answerId: number;
  question: string;
};

export type HistoryChatResponse = {
  answerId: number;
  answer: string;
};

// 함수 목적: post history chat 로직을 구현한다.
export async function postHistoryChat(payload: HistoryChatRequest): Promise<HistoryChatResponse> {
  const res = await fetch('/api/history-chat', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to chat about answer history');
  }

  return res.json();
}

/* =========================================================
 * 면접 Turn 기반 자동 채점 + 꼬리질문
 * ========================================================= */

export type InterviewTurnRequest = {
  sessionId?: number;
  questionId: number;
  topic: string;
  transcript: string;
  questionText?: string;
  modelAnswer?: string;
  requiredKeywords?: string[];
  optionalKeywords?: string[];
  generated?: boolean;
};

export type TurnEvaluation = {
  score: number;
  feedback: string;
  missingKeywords?: string[];
  strengths?: string[];
  improvements?: string[];
};

export type NextQuestionPayload = {
  id: number | null;
  topic: string;
  difficulty: number;
  questionText: string;
  modelAnswer: string;
  requiredKeywords: string[];
  optionalKeywords: string[];
  isGenerated: boolean;
  subtopic?: string;
};

export type InterviewTurnResponse = {
  evaluation: TurnEvaluation;
  nextQuestion: NextQuestionPayload;
};

// 함수 목적: post interview turn 로직을 구현한다.
export async function postInterviewTurn(payload: InterviewTurnRequest): Promise<InterviewTurnResponse> {
  const res = await fetch('/api/interview/turns', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to process interview turn');
  return res.json();
}

/* =========================================================
 * 면접 세션(Session)
 * ========================================================= */

export type CreateSessionRequest = {
  topic: string;
  difficulty?: number | null;
};

export type CreateSessionResponse = {
  sessionId: number;
};

// 함수 목적: interview session를 생성한다.
export async function createInterviewSession(payload: CreateSessionRequest): Promise<CreateSessionResponse> {
  const res = await fetch('/api/interview/sessions', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export type EndSessionResponse = {
  sessionId: number;
  endedAt?: string;
  totalTurns?: number;
  averageScore?: number;
};

// 함수 목적: end interview session 로직을 구현한다.
export async function endInterviewSession(sessionId: number): Promise<EndSessionResponse> {
  const res = await fetch(`/api/interview/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to end session');
  return res.json();
}

export type SessionReport = {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  recommendedTopics: string[];
};

// 함수 목적: API에서 interview session report를 조회한다.
export async function fetchInterviewSessionReport(sessionId: number): Promise<SessionReport> {
  const res = await fetch(`/api/interview/sessions/${sessionId}/report`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
  });
  if (!res.ok) throw new Error('Failed to generate session report');
  return res.json();
}
