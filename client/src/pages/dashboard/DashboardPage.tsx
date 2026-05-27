// 파일 목적: DashboardPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// DashboardPage.tsx — 다크/라이트 테마 전환 지원

import { ArrowRight, Award, BookOpenText, ChevronRight, LogOut, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchDashboardSummary, getStoredUser, mapTopicToServer, type DashboardSummary } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useIsMobile } from '../../components/ui/use-mobile';

import osIcon from '../../assets/categories/OS.png';
import networkIcon from '../../assets/categories/Network.png';
import databaseIcon from '../../assets/categories/Database.png';
import dataStructureIcon from '../../assets/categories/DataStructure.png';
import springIcon from '../../assets/categories/Spring.png';
import jpaIcon from '../../assets/categories/JPA.png';
import programmingIcon from '../../assets/categories/Programming.png';

import javaIcon from '../../assets/categories/Java.png';
import cIcon from '../../assets/categories/C.png';
import cppIcon from '../../assets/categories/C++.png';
import pythonIcon from '../../assets/categories/python.png';

// ─── 타입 ───────────────────────────────────────────────

type CategoryCard = {
    category: string;
    title: string;
    description: string;
    iconSrc: string;
    iconClass: string;
    tagClass: string;
    isGroup?: boolean;
    subItems?: SubItem[];
};

type SubItem = {
    category: string;
    label: string;
    iconSrc: string;
};

// ─── 난이도 선택 모달 ────────────────────────────────────

type DifficultyModalProps = {
    topic: string;
    serverTopic: string;
    onClose: () => void;
    onStart: (serverTopic: string, difficulty: number | null) => void;
};

const DIFFICULTY_OPTIONS = [
    { value: null, label: '전체', badge: 'ALL', desc: '모든 난이도 랜덤', color: 'var(--text3)' },
    { value: 1, label: '쉬움', badge: 'Lv.1', desc: '기초 개념 중심', color: 'var(--green)' },
    { value: 2, label: '보통', badge: 'Lv.2', desc: '핵심 원리 응용', color: 'var(--accent)' },
    { value: 3, label: '어려움', badge: 'Lv.3', desc: '심화 & 트레이드오프', color: 'var(--pink, #ec4899)' },
];

// 함수 목적: DifficultyModal 컴포넌트를 렌더링한다.
function DifficultyModal({ topic, serverTopic, onClose, onStart }: DifficultyModalProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 함수 목적: handler 로직을 구현한다.
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            ref={backdropRef}
            onClick={e => {
                if (e.target === backdropRef.current) onClose();
            }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div
                className="dark-card"
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '2rem',
                    border: '1px solid var(--border2)',
                    background: 'var(--bg2)',
                    borderRadius: '16px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                    animation: 'fadeInUp 0.2s ease',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem',
                    }}
                >
                    <div>
                        <p
                            style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '0.68rem',
                                color: 'var(--accent)',
                                letterSpacing: '0.12em',
                                marginBottom: '0.4rem',
                            }}
                        >
                            // 난이도 선택
                        </p>
                        <h3 style={{ color: 'var(--text)', fontSize: '1.15rem', margin: 0 }}>{topic}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text3)',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    {DIFFICULTY_OPTIONS.map(opt => {
                        const isActive = selected === opt.value;
                        return (
                            <button
                                key={String(opt.value)}
                                onClick={() => setSelected(opt.value)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.9rem 1.1rem',
                                    borderRadius: '10px',
                                    border: isActive ? `1.5px solid ${opt.color}` : '1.5px solid var(--border)',
                                    background: isActive ? `${opt.color}18` : 'var(--bg3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    textAlign: 'left',
                                    width: '100%',
                                }}
                            >
                <span
                    style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: opt.color,
                        minWidth: '36px',
                    }}
                >
                  {opt.badge}
                </span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)' }}>
                                        {opt.label}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text3)', marginTop: '0.1rem' }}>
                                        {opt.desc}
                                    </p>
                                </div>
                                {isActive && (
                                    <div
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: opt.color,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', justifyContent: 'center' }}
                    onClick={() => onStart(serverTopic, selected)}
                >
                    면접 시작 <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────

export function Dashboard() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const isMobile = useIsMobile();

    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const [modal, setModal] = useState<{ topic: string; serverTopic: string } | null>(null);
    const [langExpanded, setLangExpanded] = useState(false);

    useEffect(() => {
        fetchDashboardSummary()
            .then(data => setSummary(data))
            .finally(() => setLoading(false));
    }, []);

    const dashboardStats = useMemo(
        () => ({
            averageScore: summary?.averageScore ?? 0,
            totalAnswers: summary?.totalAnswers ?? 0,
            level: summary?.level ?? 1,
        }),
        [summary]
    );

    const categories: CategoryCard[] = useMemo(
        () => [
            {
                category: 'os',
                title: 'OS',
                description: '운영체제',
                iconSrc: osIcon,
                iconClass: 'blue',
                tagClass: 'blue',
            },
            {
                category: 'Network',
                title: 'Network',
                description: '네트워크',
                iconSrc: networkIcon,
                iconClass: 'green',
                tagClass: 'green',
            },
            {
                category: 'Database',
                title: 'Database',
                description: '데이터베이스',
                iconSrc: databaseIcon,
                iconClass: 'amber',
                tagClass: 'amber',
            },
            {
                category: 'DataStructure',
                title: 'DataStructure',
                description: '자료구조',
                iconSrc: dataStructureIcon,
                iconClass: 'pink',
                tagClass: 'pink',
            },
            {
                category: 'Spring',
                title: 'Spring',
                description: 'Spring Framework',
                iconSrc: springIcon,
                iconClass: 'green',
                tagClass: 'green',
            },
            {
                category: 'JPA',
                title: 'JPA',
                description: 'Java Persistence API',
                iconSrc: jpaIcon,
                iconClass: 'amber',
                tagClass: 'amber',
            },
            {
                category: '__lang_group__',
                title: 'Programming Language',
                description: 'Java · C · C++ · Python',
                iconSrc: programmingIcon,
                iconClass: 'blue',
                tagClass: 'blue',
                isGroup: true,
                subItems: [
                    { category: 'Java', label: 'Java', iconSrc: javaIcon },
                    { category: 'C', label: 'C', iconSrc: cIcon },
                    { category: 'C++', label: 'C++', iconSrc: cppIcon },
                    { category: 'Python', label: 'Python', iconSrc: pythonIcon },
                ],
            },
        ],
        []
    );

    const topicStatMap = useMemo(() => {
        const m = new Map<string, { count: number; averageScore: number }>();
        (summary?.topicStats ?? []).forEach(s => m.set(s.topic, { count: s.count, averageScore: s.averageScore }));
        return m;
    }, [summary]);

    // 함수 목적: card click 처리를 담당한다.
    const handleCardClick = (cat: CategoryCard) => {
        if (cat.isGroup) {
            setLangExpanded(prev => !prev);
            return;
        }
        const serverTopic = mapTopicToServer(cat.category);
        setModal({ topic: cat.title, serverTopic });
    };

    // 함수 목적: sub item click 처리를 담당한다.
    const handleSubItemClick = (sub: SubItem) => {
        const serverTopic = mapTopicToServer(sub.category);
        setModal({ topic: sub.label, serverTopic });
    };

    // 함수 목적: start 처리를 담당한다.
    const handleStart = (serverTopic: string, difficulty: number | null) => {
        setModal(null);
        navigate(`/interview/${encodeURIComponent(serverTopic)}`, {
            state: { difficulty, serverTopic },
        });
    };

    return (
        <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
            <div className="glow-blob glow-blob-primary" style={{ top: '-100px', left: '50%', transform: 'translateX(-20%)' }} />
            <div className="glow-blob glow-blob-secondary" style={{ top: '40%', right: '-100px' }} />

            <header
                className="itpt-header"
                style={
                    isMobile
                        ? {
                            padding: '0.9rem 1rem',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: '0.75rem',
                        }
                        : undefined
                }
            >
                <div className="itpt-logo">
                    IT<span>PT</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: isMobile ? '100%' : undefined }}>
                        <User size={13} style={{ color: 'var(--text3)' }} />
                        <span
                            style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '0.75rem',
                                color: 'var(--text2)',
                            }}
                        >
              {user?.name ?? '사용자'}
            </span>
                    </div>

                    <ThemeToggle size="sm" />

                    <button
                        className="btn-primary"
                        style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => navigate('/history')}
                    >
                        <Award size={13} /> 학습 기록
                    </button>

                    <button
                        className="btn-ghost"
                        style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 0.95rem', fontSize: '0.8rem' }}
                        onClick={() => navigate('/study/questions')}
                    >
                        <BookOpenText size={13} /> 질문 공부
                    </button>

                    <button
                        className="btn-ghost"
                        style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 0.9rem', fontSize: '0.8rem' }}
                        onClick={() => {
                            localStorage.removeItem('user');
                            localStorage.removeItem('accessToken');
                            navigate('/login', { replace: true });
                        }}
                    >
                        <LogOut size={13} /> 로그아웃
                    </button>
                </div>
            </header>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1060px', margin: '0 auto', padding: isMobile ? '3.25rem 1rem 4rem' : '5rem 2.5rem 6rem' }}>
                <div className="anim-1" style={{ marginBottom: '4rem' }}>
                    <div className="itpt-badge" style={{ marginBottom: '1.75rem' }}>
                        CS INTERVIEW PRACTICE
                    </div>
                    <h1 style={{ marginBottom: '0.75rem' }}>
                        안녕하세요,
                        <br />
                        <span className="gradient-text">{user?.name ?? '사용자'}님</span>
                    </h1>
                    <p style={{ fontSize: '1.05rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.8 }}>
                        오늘도 AI 면접관과 함께 기술 면접을 준비해보세요.
                    </p>
                </div>

                <div className="numbers-grid anim-2" style={{ marginBottom: '4rem', gridTemplateColumns: isMobile ? '1fr' : undefined }}>
                    <div className="number-cell">
                        <span className="number-val">{loading ? '—' : dashboardStats.averageScore}</span>
                        <p className="number-label">평균 점수 (점)</p>
                    </div>
                    <div className="number-cell">
                        <span className="number-val">{loading ? '—' : dashboardStats.totalAnswers}</span>
                        <p className="number-label">총 답변 수</p>
                    </div>
                    <div className="number-cell">
                        <span className="number-val">Lv.{loading ? '—' : dashboardStats.level}</span>
                        <p className="number-label">현재 레벨</p>
                    </div>
                </div>

                <div className="anim-3">
                    <p className="section-label">// SELECT CATEGORY</p>
                    <h2 style={{ color: 'var(--text)', marginBottom: '0.75rem' }}>과목 선택</h2>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text2)', fontWeight: 300, marginBottom: '2.5rem' }}>
                        원하는 분야를 선택하면 난이도를 고른 후 AI 면접이 시작됩니다.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 165 : 210}px, 1fr))`, gap: '1.25rem' }}>
                        {categories.map(cat => {
                            if (cat.isGroup) {
                                return (
                                    <div key={cat.category} style={{ gridColumn: langExpanded ? '1 / -1' : undefined }}>
                                        <div
                                            className="dark-card"
                                            style={{ padding: '1.75rem', cursor: 'pointer', marginBottom: langExpanded ? '0.75rem' : 0 }}
                                            onClick={() => handleCardClick(cat)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                <div
                                                    className={`card-icon ${cat.iconClass}`}
                                                    style={{
                                                        marginBottom: '1.25rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <img
                                                        src={cat.iconSrc}
                                                        alt={cat.title}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            objectFit: 'contain',
                                                            display: 'block',
                                                        }}
                                                    />
                                                </div>
                                                <ChevronRight
                                                    size={16}
                                                    style={{
                                                        color: 'var(--text3)',
                                                        transform: langExpanded ? 'rotate(90deg)' : 'rotate(0)',
                                                        transition: 'transform 0.2s ease',
                                                    }}
                                                />
                                            </div>
                                            <h3 style={{ color: 'var(--text)', marginBottom: '0.3rem' }}>{cat.title}</h3>
                                            <p
                                                style={{
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text3)',
                                                    marginBottom: '1.25rem',
                                                }}
                                            >
                                                {cat.description}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 500 }}>
                                                {langExpanded ? '접기' : '세부 언어 선택'} <ArrowRight size={13} />
                                            </div>
                                        </div>

                                        {langExpanded && (
                                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 130 : 150}px, 1fr))`, gap: '0.75rem' }}>
                                                {cat.subItems!.map(sub => {
                                                    const st = mapTopicToServer(sub.category);
                                                    const stat = topicStatMap.get(st);
                                                    const avg = stat?.averageScore ?? 0;
                                                    return (
                                                        <div
                                                            key={sub.category}
                                                            className="dark-card"
                                                            style={{
                                                                padding: '1.25rem 1.25rem 1rem',
                                                                cursor: 'pointer',
                                                                border: '1px solid var(--border2)',
                                                                textAlign: 'center',
                                                            }}
                                                            onClick={() => handleSubItemClick(sub)}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    margin: '0 auto 0.6rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <img
                                                                    src={sub.iconSrc}
                                                                    alt={sub.label}
                                                                    style={{
                                                                        width: '26px',
                                                                        height: '26px',
                                                                        objectFit: 'contain',
                                                                        display: 'block',
                                                                    }}
                                                                />
                                                            </div>
                                                            <h3 style={{ color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{sub.label}</h3>
                                                            <p
                                                                style={{
                                                                    fontFamily: 'JetBrains Mono, monospace',
                                                                    fontSize: '0.68rem',
                                                                    color: 'var(--text3)',
                                                                    marginBottom: '0.75rem',
                                                                }}
                                                            >
                                                                avg {loading ? '—' : avg}점
                                                            </p>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: 'var(--accent)', fontSize: '0.78rem' }}>
                                                                시작 <ArrowRight size={11} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            const serverTopic = mapTopicToServer(cat.category);
                            const stat = topicStatMap.get(serverTopic);
                            const answers = stat?.count ?? 0;
                            const avg = stat?.averageScore ?? 0;

                            return (
                                <div
                                    key={cat.category}
                                    className="dark-card"
                                    style={{ padding: '1.75rem', cursor: 'pointer' }}
                                    onClick={() => handleCardClick(cat)}
                                >
                                    <div
                                        className={`card-icon ${cat.iconClass}`}
                                        style={{
                                            marginBottom: '1.25rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <img
                                            src={cat.iconSrc}
                                            alt={cat.title}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                objectFit: 'contain',
                                                display: 'block',
                                            }}
                                        />
                                    </div>
                                    <h3 style={{ color: 'var(--text)', marginBottom: '0.3rem' }}>{cat.title}</h3>
                                    <p
                                        style={{
                                            fontFamily: 'JetBrains Mono, monospace',
                                            fontSize: '0.7rem',
                                            color: 'var(--text3)',
                                            marginBottom: '1.25rem',
                                        }}
                                    >
                                        {cat.description}
                                    </p>

                                    <div className="score-bar" style={{ marginBottom: '0.6rem' }}>
                                        <div className="score-bar-fill" style={{ width: loading ? '0%' : `${Math.min(avg, 100)}%` }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span
                        style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.68rem',
                            color: 'var(--text3)',
                        }}
                    >
                      답변 {loading ? '—' : answers}개
                    </span>
                                        <span className={`tag ${cat.tagClass}`} style={{ padding: '0.15rem 0.6rem', fontSize: '0.68rem' }}>
                      avg {loading ? '—' : avg}점
                    </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 500 }}>
                                        시작하기 <ArrowRight size={13} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="dark-card anim-4" style={{ padding: isMobile ? '1.25rem' : '2rem', marginTop: '3rem' }}>
                    <p className="section-label">// TIPS</p>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 160 : 200}px, 1fr))`,
                            gap: '1.5rem',
                            marginTop: '1rem',
                        }}
                    >
                        {[
                            { k: '핵심 키워드 포함', v: '답변에 핵심 개념 키워드를 빠뜨리지 마세요. AI 채점에서 가장 큰 비중을 차지합니다.' },
                            { k: '구체적 예시 제시', v: '추상적 설명보다 실제 상황이나 코드 예시를 들면 피드백 점수가 올라갑니다.' },
                            { k: '논리적 구조 유지', v: '정의 → 특징 → 예시 순서로 답변을 구성하면 일관된 고득점이 가능합니다.' },
                        ].map(tip => (
                            <div key={tip.k}>
                                <p style={{ fontWeight: 500, fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text)' }}>
                                    {tip.k}
                                </p>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.7 }}>
                                    {tip.v}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {modal && (
                <DifficultyModal
                    topic={modal.topic}
                    serverTopic={modal.serverTopic}
                    onClose={() => setModal(null)}
                    onStart={handleStart}
                />
            )}
        </div>
    );
}
