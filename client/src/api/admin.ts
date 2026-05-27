// 파일 목적: admin 기능용 API 요청 헬퍼를 제공한다.
// 위치: src/api/admin.ts
// 역할: 관리자 전용 API 호출 함수

import { http } from './http';

// ── 타입 ──────────────────────────────────────────────────────────
export type TopicStat = {
    topic: string;
    count: number;
    avgScore: number;
};

export type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    provider: 'LOCAL' | 'GOOGLE' | 'KAKAO' | 'NAVER';
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    answerCount: number;
    avgScore: number;
    topicStats: TopicStat[];
    weakTopics: string[];
};

// ── API 함수 ──────────────────────────────────────────────────────

/** 전체 회원 목록 조회 */
export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const res = await http.get<AdminUser[]>('/api/admin/users');
    return res.data;
}

/** 특정 회원 상세 조회 */
export async function fetchAdminUser(id: number): Promise<AdminUser> {
    const res = await http.get<AdminUser>(`/api/admin/users/${id}`);
    return res.data;
}

/** 활성/비활성 토글 */
export async function toggleUserStatus(id: number): Promise<AdminUser> {
    const res = await http.patch<AdminUser>(`/api/admin/users/${id}/status`);
    return res.data;
}

/** USER/ADMIN 역할 토글 */
export async function toggleUserRole(id: number): Promise<AdminUser> {
    const res = await http.patch<AdminUser>(`/api/admin/users/${id}/role`);
    return res.data;
}