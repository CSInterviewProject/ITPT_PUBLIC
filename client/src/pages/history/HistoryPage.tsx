// 파일 목적: HistoryPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/history/HistoryPage.tsx
// 디자인: 포트폴리오 스타일 (다크/라이트 테마 대응)

import { ArrowLeft, Award, Calendar, MessageSquare, RefreshCw, Send, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bar, BarChart, CartesianGrid, Cell, Legend,
    Line, LineChart, ResponsiveContainer,
    Tooltip, XAxis, YAxis,
} from 'recharts';
import {
    changePassword,
    fetchRecentAnswers,
    getStoredUser,
    postHistoryChat,
    type AnswerItem,
} from '../../lib/api';
import { isPasswordPolicySatisfied, PASSWORD_POLICY_TEXT } from '../../lib/password';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

type CategoryStat = { category: string; avgScore: number; count: number };
type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; text: string };

// 함수 목적: korean date time를 포맷한다.
function formatKoreanDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const scoreStyle = (s: number): React.CSSProperties => {
    if (s >= 85) return { color: 'var(--green)', background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.3)' };
    if (s >= 70) return { color: 'var(--accent)', background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.3)' };
    if (s >= 50) return { color: 'var(--amber)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' };
    return { color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' };
};

const TOPIC_COLORS: Record<string, string> = {
    OS: '#4F7CFF',
    Network: '#22D3A0',
    Database: '#F59E0B',
    '자료구조': '#F472B6',
    'Data Structure': '#F472B6',
    DataStructure: '#F472B6',
    Java: '#4F7CFF',
    C: '#22D3A0',
    'C++': '#F59E0B',
    Python: '#F472B6',
    Spring: '#22D3A0',
    JPA: '#F59E0B',
};

const TOPIC_TAG_CLASS: Record<string, string> = {
    OS: 'blue',
    Network: 'green',
    Database: 'amber',
    '자료구조': 'pink',
    'Data Structure': 'pink',
    DataStructure: 'pink',
    Java: 'blue',
    C: 'green',
    'C++': 'amber',
    Python: 'pink',
    Spring: 'green',
    JPA: 'amber',
};

const FALLBACK_COLORS = ['#4F7CFF', '#22D3A0', '#F59E0B', '#F472B6'];

const FEEDBACK_PROMPT = '이 답변을 면접 코치처럼 다시 피드백해줘. 잘한 점, 부족한 점, 놓친 핵심 키워드, 개선된 모범 답변 예시를 한국어로 정리해줘.';

// 함수 목적: HistoryPage 컴포넌트를 렌더링한다.
export function HistoryPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [user] = useState(() => getStoredUser());
    const [recentAnswers, setRecentAnswers] = useState<AnswerItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [chatInputs, setChatInputs] = useState<Record<number, string>>({});
    const [chatMessages, setChatMessages] = useState<Record<number, ChatMessage[]>>({});
    const [loadingFeedbackIds, setLoadingFeedbackIds] = useState<Record<number, boolean>>({});
    const [loadingChatIds, setLoadingChatIds] = useState<Record<number, boolean>>({});
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (!user?.id) {
            navigate('/login', { replace: true });
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetchRecentAnswers()
            .then(list => {
                if (!cancelled) setRecentAnswers(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!cancelled) setRecentAnswers([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [navigate, user?.id]);

    const categoryStats: CategoryStat[] = useMemo(() => {
        const m = new Map<string, { sum: number; count: number }>();

        for (const a of recentAnswers) {
            const key = a.topic || 'Unknown';
            const cur = m.get(key) ?? { sum: 0, count: 0 };
            m.set(key, { sum: cur.sum + (a.score ?? 0), count: cur.count + 1 });
        }

        return Array.from(m.entries()).map(([category, v]) => ({
            category,
            avgScore: v.count === 0 ? 0 : Math.round(v.sum / v.count),
            count: v.count,
        }));
    }, [recentAnswers]);

    const scoreProgressData = useMemo(
        () =>
            recentAnswers
                .slice()
                .reverse()
                .map((a, i) => ({
                    name: `${i + 1}번째`,
                    점수: a.score ?? 0,
                    날짜: new Date(a.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                    }),
                })),
        [recentAnswers]
    );

    const categoryChartData = useMemo(
        () => categoryStats.map(s => ({ 과목: s.category, 평균점수: s.avgScore, 답변수: s.count })),
        [categoryStats]
    );

    const insights = useMemo(() => {
        const sorted = categoryStats
            .filter(s => s.count > 0)
            .slice()
            .sort((a, b) => b.avgScore - a.avgScore);

        const recent7 = recentAnswers.slice(0, 7);

        return {
            strongest: sorted[0]?.category ?? 'N/A',
            weakest: sorted[sorted.length - 1]?.category ?? 'N/A',
            avg7:
                recent7.length === 0
                    ? 0
                    : Math.round(recent7.reduce((s, a) => s + (a.score ?? 0), 0) / recent7.length),
        };
    }, [categoryStats, recentAnswers]);

    const chartColors = {
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        axis: isDark ? '#555577' : '#9398b5',
        tooltip: {
            backgroundColor: isDark ? '#0d0f1e' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(79,124,255,0.15)',
            color: isDark ? '#f0f0f8' : '#0e1120',
            borderRadius: '10px',
        },
    };

    const card: React.CSSProperties = {
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
    };

    const sectionLabel: React.CSSProperties = {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.65rem',
        color: 'var(--accent)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        marginBottom: '0.4rem',
    };

    const passwordInputStyle: React.CSSProperties = {
        background: 'var(--bg3)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.7rem 0.85rem',
        outline: 'none',
        fontSize: '0.84rem',
    };

    // 함수 목적: run history chat 로직을 구현한다.
    async function runHistoryChat(answer: AnswerItem, question: string, appendUserMessage = true) {
        const trimmed = question.trim();
        if (!trimmed) return;

        if (appendUserMessage) {
            setChatMessages(prev => ({
                ...prev,
                [answer.id]: [...(prev[answer.id] ?? []), { role: 'user', text: trimmed }],
            }));
        }

        setLoadingChatIds(prev => ({ ...prev, [answer.id]: true }));

        try {
            const res = await postHistoryChat({ answerId: answer.id, question: trimmed });
            setChatMessages(prev => ({
                ...prev,
                [answer.id]: [...(prev[answer.id] ?? []), { role: 'assistant', text: res.answer }],
            }));
            setChatInputs(prev => ({ ...prev, [answer.id]: '' }));
        } catch (error) {
            const message = error instanceof Error ? error.message : '질문 처리 중 오류가 발생했습니다.';
            setChatMessages(prev => ({
                ...prev,
                [answer.id]: [...(prev[answer.id] ?? []), { role: 'assistant', text: message }],
            }));
        } finally {
            setLoadingChatIds(prev => ({ ...prev, [answer.id]: false }));
        }
    }

    // 함수 목적: feedback 처리를 담당한다.
    async function handleFeedback(answer: AnswerItem) {
        setLoadingFeedbackIds(prev => ({ ...prev, [answer.id]: true }));
        try {
            await runHistoryChat(answer, FEEDBACK_PROMPT, false);
        } finally {
            setLoadingFeedbackIds(prev => ({ ...prev, [answer.id]: false }));
        }
    }

    // 함수 목적: ask 처리를 담당한다.
    async function handleAsk(answer: AnswerItem) {
        const value = chatInputs[answer.id] ?? '';
        await runHistoryChat(answer, value, true);
    }

    // 함수 목적: password change 처리를 담당한다.
    async function handlePasswordChange() {
        if (!currentPassword.trim()) {
            alert('현재 비밀번호를 입력해주세요.');
            return;
        }
        if (!newPassword.trim()) {
            alert('새 비밀번호를 입력해주세요.');
            return;
        }
        if (!isPasswordPolicySatisfied(newPassword)) {
            alert(PASSWORD_POLICY_TEXT);
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }

        setChangingPassword(true);
        try {
            await changePassword({ currentPassword, newPassword });
            alert('비밀번호가 변경되었습니다.');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirm('');
        } catch (error) {
            alert(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
        } finally {
            setChangingPassword(false);
        }
    }

    return (
        <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
            <div className="glow-blob glow-blob-primary" style={{ top: '-100px', left: '60%' }} />
            <div className="glow-blob glow-blob-secondary" style={{ top: '50%', left: '-80px' }} />

            <header className="itpt-header">
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text2)',
                        fontSize: '0.875rem',
                        fontFamily: 'Noto Sans KR, sans-serif',
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft size={16} /> 대시보드로
                </button>

                <div
                    style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--text)',
                        letterSpacing: '-0.02em',
                    }}
                >
                    학습 기록
                </div>

                <ThemeToggle size="sm" />
            </header>

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '1100px',
                    margin: '0 auto',
                    padding: '4rem 2.5rem 6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                }}
            >
                <div className="numbers-grid">
                    <div className="number-cell">
                        <span className="number-val">{insights.strongest}</span>
                        <p className="number-label">가장 강한 과목</p>
                    </div>
                    <div className="number-cell">
                        <span className="number-val">{insights.weakest}</span>
                        <p className="number-label">가장 약한 과목</p>
                    </div>
                    <div className="number-cell">
                        <span className="number-val">{insights.avg7}점</span>
                        <p className="number-label">최근 7개 평균</p>
                    </div>
                </div>

                <div style={card}>
                    <p style={sectionLabel}>// ACCOUNT SECURITY</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span
                            style={{
                                fontFamily: 'Syne, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: 'var(--text)',
                            }}
                        >
                            비밀번호 변경
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '0.75rem',
                        }}
                    >
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="현재 비밀번호"
                            autoComplete="current-password"
                            style={passwordInputStyle}
                        />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="새 비밀번호"
                            autoComplete="new-password"
                            style={passwordInputStyle}
                        />
                        <input
                            type="password"
                            value={newPasswordConfirm}
                            onChange={e => setNewPasswordConfirm(e.target.value)}
                            placeholder="새 비밀번호 확인"
                            autoComplete="new-password"
                            style={passwordInputStyle}
                        />
                    </div>

                    <p style={{ marginTop: '0.65rem', fontSize: '0.76rem', color: 'var(--text3)' }}>
                        {PASSWORD_POLICY_TEXT}
                    </p>

                    <button
                        type="button"
                        onClick={() => void handlePasswordChange()}
                        disabled={changingPassword}
                        style={{
                            marginTop: '0.85rem',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0.65rem 1rem',
                            background: 'var(--accent)',
                            color: '#fff',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: changingPassword ? 'not-allowed' : 'pointer',
                            opacity: changingPassword ? 0.65 : 1,
                        }}
                    >
                        {changingPassword ? '변경 중...' : '비밀번호 변경'}
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={card}>
                        <p style={sectionLabel}>// SCORE TREND</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
                            <span
                                style={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: 'var(--text)',
                                }}
                            >
                점수 추이
              </span>
                        </div>

                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={scoreProgressData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                <XAxis dataKey="name" stroke={chartColors.axis} fontSize={11} tick={{ fill: chartColors.axis }} />
                                <YAxis domain={[0, 100]} stroke={chartColors.axis} fontSize={11} tick={{ fill: chartColors.axis }} />
                                <Tooltip contentStyle={chartColors.tooltip} />
                                <Line
                                    type="monotone"
                                    dataKey="점수"
                                    stroke="var(--accent)"
                                    strokeWidth={2.5}
                                    dot={{ fill: 'var(--accent)', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={card}>
                        <p style={sectionLabel}>// CATEGORY AVG</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Award size={15} style={{ color: 'var(--accent2)' }} />
                            <span
                                style={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: 'var(--text)',
                                }}
                            >
                과목별 평균 점수
              </span>
                        </div>

                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={categoryChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                <XAxis dataKey="과목" stroke={chartColors.axis} fontSize={11} tick={{ fill: chartColors.axis }} />
                                <YAxis domain={[0, 100]} stroke={chartColors.axis} fontSize={11} tick={{ fill: chartColors.axis }} />
                                <Tooltip contentStyle={chartColors.tooltip} />
                                <Legend wrapperStyle={{ fontSize: '11px', color: chartColors.axis }} />
                                <Bar dataKey="평균점수" radius={[6, 6, 0, 0]}>
                                    {categoryChartData.map((entry, index) => (
                                        <Cell
                                            key={entry.과목}
                                            fill={TOPIC_COLORS[entry.과목] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {categoryStats.length > 0 && (
                    <div>
                        <p style={sectionLabel}>// CATEGORY STATS</p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '1rem',
                                marginTop: '0.75rem',
                            }}
                        >
                            {categoryStats.map((stat, i) => {
                                const tc = TOPIC_TAG_CLASS[stat.category] ?? ['blue', 'green', 'amber', 'pink'][i % 4];

                                return (
                                    <div key={stat.category} className="dark-card" style={{ padding: '1.25rem 1.5rem' }}>
                    <span
                        className={`tag ${tc}`}
                        style={{ fontSize: '0.68rem', marginBottom: '0.75rem', display: 'inline-block' }}
                    >
                      {stat.category}
                    </span>

                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                      <span
                          style={{
                              fontFamily: 'Syne, sans-serif',
                              fontWeight: 800,
                              fontSize: '2rem',
                              letterSpacing: '-0.03em',
                              background: 'var(--grad-primary)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                          }}
                      >
                        {loading ? '—' : stat.avgScore}
                      </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>점</span>
                                        </div>

                                        <p
                                            style={{
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: '0.65rem',
                                                color: 'var(--text3)',
                                                marginTop: '0.25rem',
                                            }}
                                        >
                                            {loading ? '—' : stat.count}문제 풀이
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={card}>
                    <p style={sectionLabel}>// RECENT ANSWERS</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Calendar size={15} style={{ color: 'var(--green)' }} />
                        <span
                            style={{
                                fontFamily: 'Syne, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: 'var(--text)',
                            }}
                        >
              최근 답변 기록
            </span>
                    </div>

                    {loading ? (
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>
                            loading...
                        </p>
                    ) : recentAnswers.length === 0 ? (
                        <p style={{ fontSize: '0.88rem', color: 'var(--text2)', fontWeight: 300 }}>
                            아직 저장된 답변이 없습니다.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recentAnswers.map(answer => {
                                const topicTagClass = TOPIC_TAG_CLASS[answer.topic] ?? 'blue';
                                const messages = chatMessages[answer.id] ?? [];
                                const isLoadingFeedback = !!loadingFeedbackIds[answer.id];
                                const isLoadingChat = !!loadingChatIds[answer.id];

                                return (
                                    <div
                                        key={answer.id}
                                        style={{
                                            background: 'var(--bg3)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            padding: '1.25rem 1.5rem',
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'space-between',
                                                marginBottom: '0.75rem',
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className={`tag ${topicTagClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.6rem' }}>
                            {answer.topic}
                          </span>
                                                    <span
                                                        style={{
                                                            fontFamily: 'JetBrains Mono, monospace',
                                                            fontSize: '0.62rem',
                                                            color: 'var(--text3)',
                                                        }}
                                                    >
                            {formatKoreanDateTime(answer.createdAt)}
                          </span>
                                                </div>

                                                <p
                                                    style={{
                                                        fontFamily: 'Syne, sans-serif',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                        color: 'var(--text)',
                                                        lineHeight: 1.4,
                                                    }}
                                                >
                                                    {answer.questionText}
                                                </p>
                                            </div>

                                            <div
                                                style={{
                                                    ...scoreStyle(answer.score ?? 0),
                                                    padding: '0.4rem 0.9rem',
                                                    borderRadius: '8px',
                                                    fontFamily: 'Syne, sans-serif',
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    flexShrink: 0,
                                                    marginLeft: '1rem',
                                                }}
                                            >
                                                {answer.score ?? 0}점
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <p
                                                style={{
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                    fontSize: '0.62rem',
                                                    color: 'var(--text3)',
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    marginBottom: '0.4rem',
                                                }}
                                            >
                                                My Answer
                                            </p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.7 }}>
                                                {answer.userAnswer}
                                            </p>
                                        </div>

                                        <div
                                            style={{
                                                background: 'rgba(79,124,255,0.07)',
                                                border: '1px solid rgba(79,124,255,0.15)',
                                                borderRadius: '8px',
                                                padding: '0.75rem 1rem',
                                                marginBottom: '1rem',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                    fontSize: '0.62rem',
                                                    color: 'var(--accent)',
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    marginBottom: '0.4rem',
                                                }}
                                            >
                                                Feedback
                                            </p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 300, lineHeight: 1.7 }}>
                                                {answer.feedback}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text2)', fontSize: '0.82rem' }}>
                                                <MessageSquare size={15} />
                                                이 기록을 기준으로 질문할 수 있습니다.
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleFeedback(answer)}
                                                disabled={isLoadingFeedback || isLoadingChat}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    border: '1px solid rgba(79,124,255,0.25)',
                                                    background: isLoadingFeedback ? 'rgba(79,124,255,0.08)' : 'rgba(79,124,255,0.12)',
                                                    color: 'var(--text)',
                                                    borderRadius: '10px',
                                                    padding: '0.65rem 0.95rem',
                                                    cursor: isLoadingFeedback || isLoadingChat ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <RefreshCw size={14} className={isLoadingFeedback ? 'spin' : ''} />
                                                {isLoadingFeedback ? '피드백 생성 중...' : '피드백 받기'}
                                            </button>
                                        </div>

                                        {messages.length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.65rem',
                                                    marginBottom: '0.9rem',
                                                }}
                                            >
                                                {messages.map((message, index) => (
                                                    <div
                                                        key={`${answer.id}-${index}-${message.role}`}
                                                        style={{
                                                            alignSelf: message.role === 'user' ? 'flex-end' : 'stretch',
                                                            background: message.role === 'user' ? 'rgba(79,124,255,0.14)' : 'rgba(255,255,255,0.03)',
                                                            border: message.role === 'user'
                                                                ? '1px solid rgba(79,124,255,0.22)'
                                                                : '1px solid var(--border)',
                                                            borderRadius: '12px',
                                                            padding: '0.85rem 1rem',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontFamily: 'JetBrains Mono, monospace',
                                                                fontSize: '0.62rem',
                                                                color: message.role === 'user' ? 'var(--accent)' : 'var(--text3)',
                                                                letterSpacing: '0.08em',
                                                                textTransform: 'uppercase',
                                                                marginBottom: '0.35rem',
                                                            }}
                                                        >
                                                            {message.role === 'user' ? 'My Question' : 'Chatbot'}
                                                        </div>
                                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.7 }}>
                                                            {message.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-end' }}>
                      <textarea
                          value={chatInputs[answer.id] ?? ''}
                          onChange={e => setChatInputs(prev => ({ ...prev, [answer.id]: e.target.value }))}
                          onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  void handleAsk(answer);
                              }
                          }}
                          placeholder="예: 왜 이 문제에서 감점됐어? / 더 좋은 답변 예시를 알려줘"
                          rows={3}
                          style={{
                              flex: 1,
                              resize: 'vertical',
                              minHeight: '88px',
                              background: 'var(--bg2)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              padding: '0.85rem 1rem',
                              outline: 'none',
                              fontSize: '0.84rem',
                              lineHeight: 1.6,
                          }}
                      />

                                            <button
                                                type="button"
                                                onClick={() => handleAsk(answer)}
                                                disabled={isLoadingChat || !(chatInputs[answer.id] ?? '').trim()}
                                                style={{
                                                    height: '44px',
                                                    minWidth: '44px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    background: 'var(--accent)',
                                                    color: '#fff',
                                                    borderRadius: '10px',
                                                    cursor: isLoadingChat || !(chatInputs[answer.id] ?? '').trim() ? 'not-allowed' : 'pointer',
                                                    opacity: isLoadingChat || !(chatInputs[answer.id] ?? '').trim() ? 0.6 : 1,
                                                }}
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
