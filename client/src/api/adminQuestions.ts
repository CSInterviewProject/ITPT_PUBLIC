// 파일 목적: admin questions 기능용 API 요청 헬퍼를 제공한다.
// 위치: src/api/adminQuestions.ts
// 역할: 관리자 질문 은행 API 호출 함수

import { http } from './http';

// ── 타입 ──────────────────────────────────────────────────────────
export type AdminQuestion = {
    id: number;
    topic: string;
    subtopic: string | null;
    difficulty: number;          // 1~5 (서버 기준)
    questionText: string;
    modelAnswer: string | null;
    requiredKeywords: string[];
    optionalKeywords: string[];
};

export type AdminQuestionRequest = {
    topic: string;
    subtopic: string;
    difficulty: number;
    questionText: string;
    modelAnswer: string;
    requiredKeywords: string[];
    optionalKeywords: string[];
};

// difficulty int → 'easy' | 'medium' | 'hard' 변환
export function difficultyLabel(d: number): 'easy' | 'medium' | 'hard' {
    if (d <= 2) return 'easy';
    if (d <= 3) return 'medium';
    return 'hard';
}

// 'easy' | 'medium' | 'hard' → int 변환 (저장용)
export function difficultyToInt(d: string): number {
    if (d === 'easy')   return 1;
    if (d === 'medium') return 3;
    return 5;
}

// ── API 함수 ──────────────────────────────────────────────────────

export async function fetchAdminQuestions(): Promise<AdminQuestion[]> {
    const res = await http.get<AdminQuestion[]>('/api/admin/questions');
    return res.data;
}

// 함수 목적: admin question를 생성한다.
export async function createAdminQuestion(req: AdminQuestionRequest): Promise<AdminQuestion> {
    const res = await http.post<AdminQuestion>('/api/admin/questions', req);
    return res.data;
}

// 함수 목적: admin question를 갱신한다.
export async function updateAdminQuestion(id: number, req: AdminQuestionRequest): Promise<AdminQuestion> {
    const res = await http.put<AdminQuestion>(`/api/admin/questions/${id}`, req);
    return res.data;
}

// 함수 목적: 함수의 역할을 수행한다.
export async function deleteAdminQuestion(id: number): Promise<void> {
    await http.delete(`/api/admin/questions/${id}`);
}