// 파일 목적: admin records 기능용 API 요청 헬퍼를 제공한다.
// 위치: src/api/adminRecords.ts
// 역할: 관리자 면접 기록 / 시스템 운영 탭 API 호출

import { http } from './http';

// ── 면접 세션 ───────────────────────────────────────────────────
export type AdminSession = {
    sessionId: number;
    userId:    number;
    userName:  string;
    topic:     string;
    turnCount: number;
    avgScore:  number;
    status:    'ACTIVE' | 'ENDED';
    startedAt: string; // "yyyy-MM-dd HH:mm"
};

// ── 면접 기록 요약 통계 ────────────────────────────────────────
export type AdminRecordStats = {
    totalSessions:  number;
    avgScore:       number;
    todaySessions:  number;
    bestScore:      number;
    bestScoreInfo:  string; // "userName · topic"
};

// ── 카테고리별 통계 ────────────────────────────────────────────
export type AdminCategoryStat = {
    topic:    string;
    count:    number;
    avgScore: number;
};

// ── 시스템 서비스 상태 ─────────────────────────────────────────
export type ServiceStatus = {
    name:    string;
    status:  'ok' | 'warn' | 'error';
    latency: string;
    rate:    string;
};
export type SystemHealth = {
    services:  ServiceStatus[];
    checkedAt: string;
};

// ── 시스템 로그 ────────────────────────────────────────────────
export type AdminSystemLog = {
    id: number;
    level: 'ERROR' | 'WARN' | 'INFO';
    service: string;
    eventType: string;
    message: string;
    traceId: string | null;
    userId: number | null;
    count: number;
    createdAt: string; // "yyyy-MM-dd HH:mm:ss"
    time: string;      // "HH:mm:ss"
};

// ── API 함수 ───────────────────────────────────────────────────

/** 전체 면접 세션 목록 (최신순) */
export const fetchAdminSessions = (): Promise<AdminSession[]> =>
    http.get('/api/admin/records').then(r => r.data);

/** 면접 기록 요약 통계 */
export const fetchAdminRecordStats = (): Promise<AdminRecordStats> =>
    http.get('/api/admin/records/stats').then(r => r.data);

/** 카테고리별 평균 점수 */
export const fetchAdminCategoryStats = (): Promise<AdminCategoryStat[]> =>
    http.get('/api/admin/records/category-stats').then(r => r.data);

/** 시스템 서비스 상태 */
export const fetchSystemHealth = (): Promise<SystemHealth> =>
    http.get('/api/admin/system/health').then(r => r.data);

/** 시스템 로그 목록 */
export const fetchSystemLogs = (): Promise<AdminSystemLog[]> =>
    http.get('/api/admin/system/logs').then(r => r.data);
