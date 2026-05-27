// 파일 목적: AdminPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/admin/AdminPage.tsx
// 역할: 관리자 페이지 — 질문 은행 / 사용자 / 면접 기록 / 시스템 운영

import {
  AlertTriangle, BookOpen, CheckCircle, ChevronDown,
  Database, Edit2, LogOut, Plus, RefreshCw, Search,
  Settings, Shield, Trash2, TrendingUp, Users, XCircle, X,
  AlertCircle, BarChart2, Activity,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import {
  AdminUser, fetchAdminUsers, toggleUserStatus, toggleUserRole,
} from '../../api/admin';
import {
  AdminQuestion, AdminQuestionRequest,
  fetchAdminQuestions, createAdminQuestion, updateAdminQuestion, deleteAdminQuestion,
  difficultyLabel, difficultyToInt,
} from '../../api/adminQuestions';
import {
  AdminSession, AdminRecordStats, AdminCategoryStat, SystemHealth, AdminSystemLog,
  fetchAdminSessions, fetchAdminRecordStats, fetchAdminCategoryStats, fetchSystemHealth, fetchSystemLogs,
} from '../../api/adminRecords';

// ── 유틸 ─────────────────────────────────────────────────────────
const diffStyle = (d: 'easy' | 'medium' | 'hard') => {
  if (d === 'easy')   return { label: '쉬움',   color: 'var(--green)', bg: 'rgba(34,211,160,0.1)',  border: 'rgba(34,211,160,0.25)'  };
  if (d === 'medium') return { label: '보통',   color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  };
  return               { label: '어려움', color: '#ef4444',       bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' };
};

const scoreStyle = (s: number): React.CSSProperties => {
  if (s >= 85) return { color: 'var(--green)',  background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.25)' };
  if (s >= 70) return { color: 'var(--accent)', background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.25)' };
  if (s >= 50) return { color: 'var(--amber)',  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' };
  return { color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' };
};

// 함수 목적: level style 로직을 구현한다.
const levelStyle = (l: string) => {
  if (l === 'ERROR') return { color: '#ef4444',       bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  };
  if (l === 'WARN')  return { color: 'var(--amber)',  bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };
  return                    { color: 'var(--green)',  bg: 'rgba(34,211,160,0.1)', border: 'rgba(34,211,160,0.3)' };
};

// 함수 목적: topic bar color 로직을 구현한다.
const topicBarColor = (avg: number) => {
  if (avg >= 85) return { bar: 'linear-gradient(90deg,var(--green),#4ade80)',          text: 'var(--green)'  };
  if (avg >= 70) return { bar: 'linear-gradient(90deg,var(--accent),var(--accent2))',  text: 'var(--accent)' };
  if (avg >= 50) return { bar: 'linear-gradient(90deg,var(--amber),#fbbf24)',          text: 'var(--amber)'  };
  return               { bar: 'linear-gradient(90deg,#ef4444,#f87171)',                text: '#ef4444'        };
};

// 함수 목적: service color 로직을 구현한다.
const serviceColor = (status: 'ok' | 'warn' | 'error') => {
  if (status === 'ok')   return { dot: 'var(--green)',  border: 'rgba(34,211,160,0.2)',  text: 'var(--green)'  };
  if (status === 'warn') return { dot: 'var(--amber)',  border: 'rgba(245,158,11,0.2)',  text: 'var(--amber)'  };
  return                        { dot: '#ef4444',       border: 'rgba(239,68,68,0.2)',   text: '#ef4444'       };
};

const catTagCls: Record<string, string> = {
  OS: 'blue', Network: 'green', Database: 'amber',
  Java: 'pink', Spring: 'green', DataStructure: 'pink',
};

type Tab = 'questions' | 'users' | 'records' | 'system';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'questions', label: '질문 은행',   icon: <BookOpen   size={15} /> },
  { id: 'users',     label: '사용자',      icon: <Users      size={15} /> },
  { id: 'records',   label: '면접 기록',   icon: <TrendingUp size={15} /> },
  { id: 'system',    label: '시스템 운영', icon: <Settings   size={15} /> },
];

// ── 질문 추가/수정 모달 ──────────────────────────────────────────
const TOPICS = ['OS', 'Network', 'Database', 'Java', 'Spring','DataStructure'];
const DIFFICULTIES = [
  { label: '쉬움',   value: 'easy'   },
  { label: '보통',   value: 'medium' },
  { label: '어려움', value: 'hard'   },
];

type QModalState = {
  topic: string; subtopic: string; difficulty: string;
  questionText: string; modelAnswer: string;
  requiredKeywords: string; optionalKeywords: string;
};

// 함수 목적: QuestionModal 컴포넌트를 렌더링한다.
function QuestionModal({
                         initial, onSave, onClose, saving,
                       }: {
  initial: QModalState | null;
  onSave: (data: QModalState) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<QModalState>(initial ?? {
    topic: 'OS', subtopic: '', difficulty: 'medium',
    questionText: '', modelAnswer: '', requiredKeywords: '', optionalKeywords: '',
  });

  // 함수 목적: set 로직을 구현한다.
  const set = (key: keyof QModalState, val: string) =>
      setForm(prev => ({ ...prev, [key]: val }));

  const inp: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: '9px', padding: '0.55rem 0.9rem', fontSize: '0.82rem',
    color: 'var(--text)', outline: 'none', width: '100%',
    fontFamily: 'Noto Sans KR, sans-serif',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.62rem', color: 'var(--text3)',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '0.4rem',
  };

  return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
           onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '18px',
          width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--accent)',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            {initial ? '// EDIT QUESTION' : '// ADD QUESTION'}
          </p>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem',
            color: 'var(--text)', marginBottom: '1.5rem' }}>
            {initial ? '질문 수정' : '새 질문 추가'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={lbl}>카테고리</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.topic}
                      onChange={e => set('topic', e.target.value)}>
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>난이도</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.difficulty}
                      onChange={e => set('difficulty', e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>세부 주제 (subtopic)</label>
            <input style={inp} value={form.subtopic} placeholder="예: Deadlock, TCP/IP ..."
                   onChange={e => set('subtopic', e.target.value)} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>질문 내용</label>
            <textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
                      value={form.questionText} onChange={e => set('questionText', e.target.value)} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>모범 답안</label>
            <textarea style={{ ...inp, minHeight: '120px', resize: 'vertical' }}
                      value={form.modelAnswer} onChange={e => set('modelAnswer', e.target.value)} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>필수 키워드 (쉼표 구분)</label>
            <input style={inp} value={form.requiredKeywords} placeholder="PCB, 컨텍스트 스위칭, 힙"
                   onChange={e => set('requiredKeywords', e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={lbl}>선택 키워드 (쉼표 구분)</label>
            <input style={inp} value={form.optionalKeywords} placeholder="스케줄링, 인터럽트 ..."
                   onChange={e => set('optionalKeywords', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '0.7rem' }}
                    onClick={onClose}>취소</button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.7rem', opacity: saving ? 0.6 : 1 }}
                    onClick={() => onSave(form)} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
  );
}

// ── 회원 상세 모달 ───────────────────────────────────────────────
function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const card: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem 1.5rem' };
  const sl:   React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--accent)', letterSpacing: '0.14em', textTransform: 'uppercase' as const };

  return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
           onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '18px',
          width: '100%', maxWidth: '620px', maxHeight: '88vh', overflowY: 'auto',
          padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user.name[0]}
              </div>
              <div>
                <p style={{ ...sl, marginBottom: '0.2rem' }}>// USER DETAIL</p>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>{user.name}</h3>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text3)', marginTop: '1px' }}>{user.email}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
            {[
              { label: '답변 수',  value: `${user.answerCount}건`, color: 'var(--accent)' },
              { label: '평균 점수', value: `${user.avgScore}점`,   color: user.avgScore >= 70 ? 'var(--green)' : '#ef4444' },
              { label: '가입일',   value: user.createdAt,          color: 'var(--text2)' },
            ].map(s => (
                <div key={s.label} style={{ ...card, padding: '1rem' }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text3)', marginBottom: '0.35rem' }}>{s.label}</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: s.color }}>{s.value}</p>
                </div>
            ))}
          </div>

          {user.weakTopics.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '12px', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ ...sl, color: '#ef4444', marginBottom: '0.4rem' }}>취약 토픽 감지</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>평균 70점 미만인 카테고리가 있습니다. 집중 보완이 필요합니다.</p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                    {user.weakTopics.map(t => (
                        <span key={t} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                          color: '#ef4444', background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          padding: '0.18rem 0.6rem', borderRadius: '5px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
          )}

          {user.topicStats.length > 0 ? (
              <div style={card}>
                <p style={{ ...sl, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BarChart2 size={12} /> 토픽별 성적
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {user.topicStats.map(ts => {
                    const col    = topicBarColor(ts.avgScore);
                    const isWeak = ts.avgScore < 70;
                    return (
                        <div key={ts.topic}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className={`tag ${catTagCls[ts.topic] ?? 'blue'}`} style={{ fontSize: '0.62rem' }}>{ts.topic}</span>
                              {isWeak && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '1px 5px', borderRadius: '4px' }}>취약</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--text3)' }}>{ts.count}건</span>
                              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: col.text }}>{ts.avgScore}점</span>
                            </div>
                          </div>
                          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${ts.avgScore}%`, background: col.bar, borderRadius: '99px', transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)' }} />
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
          ) : (
              <div style={{ ...card, textAlign: 'center', padding: '2rem' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>아직 풀이 기록이 없습니다.</p>
              </div>
          )}

          <div style={{ ...card, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: '권한',     value: user.role },
              { label: '상태',     value: user.status },
              { label: '가입 방식', value: user.provider },
            ].map(r => (
                <div key={r.label}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text3)', marginBottom: '0.25rem' }}>{r.label}</p>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--text2)' }}>{r.value}</p>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export function AdminPage() {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState<Tab>('questions');
  const [qSearch,   setQSearch]   = useState('');
  const [qCategory, setQCategory] = useState('전체');
  const [uSearch,   setUSearch]   = useState('');
  const [sysFilter, setSysFilter] = useState<'ALL'|'ERROR'|'WARN'|'INFO'>('ALL');

  // ── 질문 은행 상태 ──
  const [questions,   setQuestions]   = useState<AdminQuestion[]>([]);
  const [qLoading,    setQLoading]    = useState(false);
  const [qError,      setQError]      = useState('');
  const [showQModal,  setShowQModal]  = useState(false);
  const [editQ,       setEditQ]       = useState<AdminQuestion | null>(null);
  const [qSaving,     setQSaving]     = useState(false);

  // ── 회원 상태 ──
  const [users,        setUsers]        = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError,   setUsersError]   = useState('');
  const [detailUser,   setDetailUser]   = useState<AdminUser | null>(null);

  // ── 면접 기록 상태 ──
  const [sessions,       setSessions]       = useState<AdminSession[]>([]);
  const [recordStats,    setRecordStats]    = useState<AdminRecordStats | null>(null);
  const [categoryStats,  setCategoryStats]  = useState<AdminCategoryStat[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError,   setRecordsError]   = useState('');

  // ── 시스템 운영 상태 ──
  const [systemHealth,  setSystemHealth]  = useState<SystemHealth | null>(null);
  const [systemLogs,    setSystemLogs]    = useState<AdminSystemLog[]>([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemError,   setSystemError]   = useState('');

  // ── 질문 은행 로드 ──
  useEffect(() => {
    if (tab !== 'questions') return;
    setQLoading(true); setQError('');
    fetchAdminQuestions()
        .then(data => setQuestions(data))
        .catch(() => setQError('질문 데이터를 불러오지 못했습니다.'))
        .finally(() => setQLoading(false));
  }, [tab]);

  // ── 회원 로드 ──
  useEffect(() => {
    if (tab !== 'users') return;
    setUsersLoading(true); setUsersError('');
    fetchAdminUsers()
        .then(data => setUsers(data))
        .catch(() => setUsersError('회원 데이터를 불러오지 못했습니다.'))
        .finally(() => setUsersLoading(false));
  }, [tab]);

  // ── 면접 기록 로드 ──
  useEffect(() => {
    if (tab !== 'records') return;
    setRecordsLoading(true); setRecordsError('');
    Promise.all([
      fetchAdminSessions(),
      fetchAdminRecordStats(),
      fetchAdminCategoryStats(),
    ])
        .then(([sess, stats, cats]) => {
          setSessions(sess);
          setRecordStats(stats);
          setCategoryStats(cats);
        })
        .catch(() => setRecordsError('면접 기록을 불러오지 못했습니다.'))
        .finally(() => setRecordsLoading(false));
  }, [tab]);

  // ── 시스템 운영 로드 ──
  useEffect(() => {
    if (tab !== 'system') return;
    setSystemLoading(true); setSystemError('');
    Promise.all([
      fetchSystemHealth(),
      fetchSystemLogs(),
    ])
        .then(([health, logs]) => {
          setSystemHealth(health);
          setSystemLogs(logs);
        })
        .catch(() => setSystemError('시스템 상태/로그를 불러오지 못했습니다.'))
        .finally(() => setSystemLoading(false));
  }, [tab]);

  // ── 질문 저장 (추가 / 수정) ──
  const handleSaveQuestion = async (form: QModalState) => {
    setQSaving(true);
    const req: AdminQuestionRequest = {
      topic: form.topic, subtopic: form.subtopic,
      difficulty: difficultyToInt(form.difficulty),
      questionText: form.questionText, modelAnswer: form.modelAnswer,
      requiredKeywords: form.requiredKeywords.split(',').map(s => s.trim()).filter(Boolean),
      optionalKeywords: form.optionalKeywords.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      if (editQ) {
        const updated = await updateAdminQuestion(editQ.id, req);
        setQuestions(prev => prev.map(q => q.id === editQ.id ? updated : q));
      } else {
        const created = await createAdminQuestion(req);
        setQuestions(prev => [created, ...prev]);
      }
      setShowQModal(false); setEditQ(null);
    } catch { alert('저장에 실패했습니다.'); }
    finally { setQSaving(false); }
  };

  // 함수 목적: delete question 처리를 담당한다.
  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteAdminQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch { alert('삭제에 실패했습니다.'); }
  };

  // 함수 목적: toggle status 처리를 담당한다.
  const handleToggleStatus = async (id: number) => {
    try {
      const updated = await toggleUserStatus(id);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      if (detailUser?.id === id) setDetailUser(updated);
    } catch { /* 조용히 실패 */ }
  };

  // 함수 목적: toggle role 처리를 담당한다.
  const handleToggleRole = async (id: number) => {
    try {
      const updated = await toggleUserRole(id);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      if (detailUser?.id === id) setDetailUser(updated);
    } catch { /* 조용히 실패 */ }
  };

  // 함수 목적: refresh system 처리를 담당한다.
  const handleRefreshSystem = () => {
    setSystemLoading(true); setSystemError('');
    fetchSystemHealth()
        .then(setSystemHealth)
        .catch(() => setSystemError('시스템 상태를 불러오지 못했습니다.'))
        .finally(() => setSystemLoading(false));
  };

  // ── 필터링 ──
  const filteredQ = useMemo(() => questions.filter(q => {
    const matchCat  = qCategory === '전체' || q.topic === qCategory;
    const matchText = q.questionText.toLowerCase().includes(qSearch.toLowerCase())
        || q.requiredKeywords.some(k => k.includes(qSearch))
        || q.optionalKeywords.some(k => k.includes(qSearch));
    return matchCat && matchText;
  }), [questions, qSearch, qCategory]);

  const filteredU   = useMemo(() => users.filter(u => u.name.includes(uSearch) || u.email.includes(uSearch)), [users, uSearch]);
  const filteredSys = useMemo(() => sysFilter === 'ALL' ? systemLogs : systemLogs.filter(l => l.level === sysFilter), [sysFilter, systemLogs]);

  // ── 공통 스타일 ──
  const card:     React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 1.75rem' };
  const th:       React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.75rem 0.75rem', textAlign: 'left' as const };
  const td:       React.CSSProperties = { padding: '0.9rem 0.75rem', fontSize: '0.85rem', color: 'var(--text)', borderTop: '1px solid var(--border)', verticalAlign: 'middle' };
  const inp:      React.CSSProperties = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '9px', padding: '0.55rem 0.9rem', fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'Noto Sans KR, sans-serif', outline: 'none' };
  const sl:       React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--accent)', letterSpacing: '0.14em', textTransform: 'uppercase' as const };
  const smallBtn  = (col: string, bg: string, border: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem',
    borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
    color: col, background: bg, border: `1px solid ${border}`,
  });

  return (
      <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
        <div className="glow-blob glow-blob-primary"   style={{ top: '-80px', right: '20%' }} />
        <div className="glow-blob glow-blob-secondary" style={{ bottom: '10%', left: '-80px' }} />

        {/* ── 헤더 ── */}
        <header className="itpt-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="itpt-logo">IT<span>PT</span></div>
            <span style={{ ...sl, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', padding: '0.2rem 0.6rem', borderRadius: '5px' }}>ADMIN</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle size="sm" />
            <button className="btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard')}>
              <LogOut size={13} /> 대시보드
            </button>
          </div>
        </header>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', maxWidth: '1300px', margin: '0 auto', padding: '2.5rem 2rem', gap: '1.5rem' }}>

          {/* ── 사이드바 ── */}
          <aside style={{ width: '200px', flexShrink: 0 }}>
            <div style={{ ...card, padding: '1rem', position: 'sticky', top: '5rem' }}>
              <p style={{ ...sl, marginBottom: '1rem', padding: '0 0.5rem' }}>// MENU</p>
              {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                    padding: '0.65rem 0.75rem', borderRadius: '9px', border: 'none',
                    background: tab === t.id ? 'rgba(79,124,255,0.12)' : 'transparent',
                    color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
                    fontSize: '0.85rem', fontWeight: tab === t.id ? 600 : 400,
                    cursor: 'pointer', marginBottom: '0.25rem',
                    fontFamily: 'Noto Sans KR, sans-serif',
                    borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.18s',
                  }}>
                    {t.icon} {t.label}
                  </button>
              ))}
            </div>
          </aside>

          {/* ── 콘텐츠 ── */}
          <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ════════ 질문 은행 ════════ */}
            {tab === 'questions' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <p style={sl}>// QUESTION BANK</p>
                      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)', letterSpacing: '-0.03em' }}>질문 은행 관리</h2>
                    </div>
                    <button className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}
                            onClick={() => { setEditQ(null); setShowQModal(true); }}>
                      <Plus size={14} /> 질문 추가
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
                      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                      <input style={{ ...inp, paddingLeft: '2rem', width: '100%' }}
                             placeholder="질문 또는 키워드 검색..."
                             value={qSearch} onChange={e => setQSearch(e.target.value)} />
                    </div>
                    {['전체', ...TOPICS].map(cat => (
                        <button key={cat} onClick={() => setQCategory(cat)}
                                style={{ ...inp, cursor: 'pointer', padding: '0.55rem 1rem',
                                  background: qCategory === cat ? 'rgba(79,124,255,0.12)' : 'var(--bg3)',
                                  border: qCategory === cat ? '1px solid rgba(79,124,255,0.4)' : '1px solid var(--border)',
                                  color: qCategory === cat ? 'var(--accent)' : 'var(--text2)',
                                }}>
                          {cat}
                        </button>
                    ))}
                  </div>

                  {qError && (
                      <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.83rem', color: '#ef4444' }}>
                        <AlertTriangle size={14} /> {qError}
                      </div>
                  )}

                  <div style={card}>
                    {qLoading ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>불러오는 중...</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                          <tr>
                            <th style={th}>카테고리</th>
                            <th style={th}>질문</th>
                            <th style={th}>난이도</th>
                            <th style={th}>키워드</th>
                            <th style={th}>모범답안</th>
                            <th style={th}>관리</th>
                          </tr>
                          </thead>
                          <tbody>
                          {filteredQ.map(q => {
                            const dl          = diffStyle(difficultyLabel(q.difficulty));
                            const allKeywords = [...q.requiredKeywords, ...q.optionalKeywords];
                            return (
                                <tr key={q.id}>
                                  <td style={td}><span className={`tag ${catTagCls[q.topic] ?? 'blue'}`} style={{ fontSize: '0.65rem' }}>{q.topic}</span></td>
                                  <td style={{ ...td, maxWidth: '280px', color: 'var(--text)' }}>
                                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.questionText}</span>
                                  </td>
                                  <td style={td}>
                                    <span style={{ ...sl, color: dl.color, background: dl.bg, border: `1px solid ${dl.border}`, padding: '0.2rem 0.55rem', borderRadius: '5px' }}>{dl.label}</span>
                                  </td>
                                  <td style={td}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                      {allKeywords.slice(0, 3).map(k => (
                                          <span key={k} style={{ ...sl, color: 'var(--accent2)', background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)', padding: '1px 6px', borderRadius: '4px' }}>{k}</span>
                                      ))}
                                      {allKeywords.length > 3 && <span style={{ ...sl, color: 'var(--text3)' }}>+{allKeywords.length - 3}</span>}
                                    </div>
                                  </td>
                                  <td style={td}>
                                    {q.modelAnswer
                                        ? <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                                        : <XCircle    size={14} style={{ color: 'var(--text3)' }} />}
                                  </td>
                                  <td style={td}>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                      <button style={smallBtn('var(--accent)', 'rgba(79,124,255,0.1)', 'rgba(79,124,255,0.25)')}
                                              onClick={() => { setEditQ(q); setShowQModal(true); }}>
                                        <Edit2 size={11} /> 수정
                                      </button>
                                      <button style={smallBtn('#ef4444', 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.25)')}
                                              onClick={() => handleDeleteQuestion(q.id)}>
                                        <Trash2 size={11} /> 삭제
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                            );
                          })}
                          </tbody>
                        </table>
                    )}
                  </div>

                  {showQModal && (
                      <QuestionModal
                          initial={editQ ? {
                            topic: editQ.topic, subtopic: editQ.subtopic ?? '',
                            difficulty: difficultyLabel(editQ.difficulty),
                            questionText: editQ.questionText, modelAnswer: editQ.modelAnswer ?? '',
                            requiredKeywords: editQ.requiredKeywords.join(', '),
                            optionalKeywords: editQ.optionalKeywords.join(', '),
                          } : null}
                          onSave={handleSaveQuestion}
                          onClose={() => { setShowQModal(false); setEditQ(null); }}
                          saving={qSaving}
                      />
                  )}
                </>
            )}

            {/* ════════ 사용자 관리 ════════ */}
            {tab === 'users' && (
                <>
                  <div>
                    <p style={sl}>// USER MANAGEMENT</p>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)', letterSpacing: '-0.03em' }}>사용자 관리</h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
                    {[
                      { label: '전체 사용자', value: users.length,                                       color: 'var(--accent)', bg: 'rgba(79,124,255,0.1)'  },
                      { label: '활성 계정',   value: users.filter(u => u.status === 'ACTIVE').length,   color: 'var(--green)',  bg: 'rgba(34,211,160,0.1)'  },
                      { label: '비활성 계정', value: users.filter(u => u.status === 'INACTIVE').length, color: 'var(--amber)',  bg: 'rgba(245,158,11,0.1)'  },
                      { label: '관리자',      value: users.filter(u => u.role === 'ADMIN').length,       color: '#ef4444',       bg: 'rgba(239,68,68,0.1)'   },
                    ].map(s => (
                        <div key={s.label} style={{ ...card, padding: '1.25rem' }}>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text3)', marginBottom: '0.5rem' }}>{s.label}</p>
                          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03em', color: s.color }}>{usersLoading ? '—' : s.value}</p>
                        </div>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                    <input style={{ ...inp, paddingLeft: '2.25rem', width: '100%', maxWidth: '360px' }}
                           placeholder="이름 또는 이메일 검색..."
                           value={uSearch} onChange={e => setUSearch(e.target.value)} />
                  </div>

                  {usersError && (
                      <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.83rem', color: '#ef4444' }}>
                        <AlertTriangle size={14} /> {usersError}
                      </div>
                  )}

                  <div style={card}>
                    {usersLoading ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>불러오는 중...</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                          <tr>
                            <th style={th}>사용자</th><th style={th}>이메일</th><th style={th}>권한</th>
                            <th style={th}>상태</th><th style={th}>가입일</th><th style={th}>답변 수</th>
                            <th style={th}>평균 점수</th><th style={th}>취약 토픽</th><th style={th}>관리</th>
                          </tr>
                          </thead>
                          <tbody>
                          {filteredU.map(u => (
                              <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setDetailUser(u)}>
                                <td style={td}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{u.name[0]}</div>
                                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                                  </div>
                                </td>
                                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text2)' }}>{u.email}</td>
                                <td style={td}>
                            <span style={{ ...sl, color: u.role === 'ADMIN' ? '#ef4444' : 'var(--accent)', background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.1)' : 'rgba(79,124,255,0.1)', border: `1px solid ${u.role === 'ADMIN' ? 'rgba(239,68,68,0.25)' : 'rgba(79,124,255,0.25)'}`, padding: '0.18rem 0.55rem', borderRadius: '5px' }}>
                              {u.role === 'ADMIN'
                                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Shield size={10} /> ADMIN</span>
                                  : 'USER'}
                            </span>
                                </td>
                                <td style={td}>
                            <span style={{ ...sl, color: u.status === 'ACTIVE' ? 'var(--green)' : 'var(--text3)', background: u.status === 'ACTIVE' ? 'rgba(34,211,160,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(34,211,160,0.25)' : 'var(--border)'}`, padding: '0.18rem 0.55rem', borderRadius: '5px' }}>
                              {u.status === 'ACTIVE' ? '활성' : '비활성'}
                            </span>
                                </td>
                                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text2)' }}>{u.createdAt}</td>
                                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: 'var(--text2)' }}>{u.answerCount}</td>
                                <td style={td}>
                            <span style={{ ...scoreStyle(u.avgScore), padding: '0.2rem 0.6rem', borderRadius: '6px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>
                              {u.answerCount === 0 ? '-' : `${u.avgScore}점`}
                            </span>
                                </td>
                                <td style={td} onClick={e => e.stopPropagation()}>
                                  {u.weakTopics.length === 0 ? (
                                      <span style={{ ...sl, color: 'var(--green)', fontSize: '0.6rem' }}>없음</span>
                                  ) : (
                                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                        {u.weakTopics.map(t => (
                                            <span key={t} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '1px 5px', borderRadius: '4px' }}>{t}</span>
                                        ))}
                                      </div>
                                  )}
                                </td>
                                <td style={td} onClick={e => e.stopPropagation()}>
                                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <button style={smallBtn('var(--accent)', 'rgba(79,124,255,0.1)', 'rgba(79,124,255,0.25)')} onClick={() => handleToggleRole(u.id)}>권한 변경</button>
                                    <button style={smallBtn(u.status === 'ACTIVE' ? 'var(--amber)' : 'var(--green)', u.status === 'ACTIVE' ? 'rgba(245,158,11,0.1)' : 'rgba(34,211,160,0.1)', u.status === 'ACTIVE' ? 'rgba(245,158,11,0.25)' : 'rgba(34,211,160,0.25)')} onClick={() => handleToggleStatus(u.id)}>
                                      {u.status === 'ACTIVE' ? '비활성화' : '활성화'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                    )}
                  </div>

                  {detailUser && <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />}
                </>
            )}

            {/* ════════ 면접 기록 (실제 API 연동) ════════ */}
            {tab === 'records' && (
                <>
                  <div>
                    <p style={sl}>// INTERVIEW RECORDS</p>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)', letterSpacing: '-0.03em' }}>면접 기록 / 통계</h2>
                  </div>

                  {recordsError && (
                      <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.83rem', color: '#ef4444' }}>
                        <AlertTriangle size={14} /> {recordsError}
                      </div>
                  )}

                  {/* 요약 통계 카드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
                    {recordsLoading || !recordStats ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={{ ...card, padding: '1.25rem' }}>
                              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text3)', marginBottom: '0.5rem' }}>—</p>
                              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--border)' }}>—</p>
                            </div>
                        ))
                    ) : [
                      { label: '총 세션 수',  value: `${recordStats.totalSessions}건`,  sub: '전체 누적' },
                      { label: '전체 평균',   value: `${recordStats.avgScore}점`,        sub: '모든 답변 기준' },
                      { label: '오늘 세션',   value: `${recordStats.todaySessions}건`,   sub: new Date().toLocaleDateString('ko-KR') },
                      { label: '최고 점수',   value: `${recordStats.bestScore}점`,       sub: recordStats.bestScoreInfo },
                    ].map(s => (
                        <div key={s.label} style={{ ...card, padding: '1.25rem' }}>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text3)', marginBottom: '0.5rem' }}>{s.label}</p>
                          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.03em', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</p>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text3)', marginTop: '0.2rem' }}>{s.sub}</p>
                        </div>
                    ))}
                  </div>

                  {/* 카테고리별 평균 점수 */}
                  <div style={card}>
                    <p style={{ ...sl, marginBottom: '1.25rem' }}>// CATEGORY AVERAGE</p>
                    {recordsLoading ? (
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>불러오는 중...</p>
                    ) : categoryStats.length === 0 ? (
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center', padding: '1rem 0' }}>아직 데이터가 없습니다.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {categoryStats.map(c => (
                              <div key={c.topic} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span className={`tag ${catTagCls[c.topic] ?? 'blue'}`} style={{ fontSize: '0.65rem', width: '72px', textAlign: 'center' }}>{c.topic}</span>
                                <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${c.avgScore}%`, background: topicBarColor(c.avgScore).bar, borderRadius: '99px', transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }} />
                                </div>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: topicBarColor(c.avgScore).text, minWidth: '42px' }}>{c.avgScore}점</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--text3)', minWidth: '50px' }}>{c.count}건</span>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>

                  {/* 면접 세션 목록 */}
                  <div style={card}>
                    <p style={{ ...sl, marginBottom: '1.25rem' }}>// RECENT SESSIONS</p>
                    {recordsLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>불러오는 중...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>아직 면접 세션이 없습니다.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                          <tr>
                            <th style={th}>사용자</th>
                            <th style={th}>카테고리</th>
                            <th style={th}>답변 수</th>
                            <th style={th}>평균 점수</th>
                            <th style={th}>상태</th>
                            <th style={th}>시작 일시</th>
                          </tr>
                          </thead>
                          <tbody>
                          {sessions.map(s => (
                              <tr key={s.sessionId}>
                                <td style={{ ...td, fontWeight: 500 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{s.userName[0]}</div>
                                    {s.userName}
                                  </div>
                                </td>
                                <td style={td}>
                                  <span className={`tag ${catTagCls[s.topic] ?? 'blue'}`} style={{ fontSize: '0.65rem' }}>{s.topic}</span>
                                </td>
                                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: 'var(--text2)' }}>{s.turnCount}건</td>
                                <td style={td}>
                                  {s.turnCount === 0
                                      ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>-</span>
                                      : <span style={{ ...scoreStyle(s.avgScore), padding: '0.2rem 0.6rem', borderRadius: '6px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>{s.avgScore}점</span>
                                  }
                                </td>
                                <td style={td}>
                            <span style={{ ...sl,
                              color: s.status === 'ENDED' ? 'var(--green)' : 'var(--amber)',
                              background: s.status === 'ENDED' ? 'rgba(34,211,160,0.1)' : 'rgba(245,158,11,0.1)',
                              border: `1px solid ${s.status === 'ENDED' ? 'rgba(34,211,160,0.25)' : 'rgba(245,158,11,0.25)'}`,
                              padding: '0.18rem 0.55rem', borderRadius: '5px',
                            }}>
                              {s.status === 'ENDED' ? '완료' : '진행중'}
                            </span>
                                </td>
                                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text3)' }}>{s.startedAt}</td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                    )}
                  </div>
                </>
            )}

            {/* ════════ 시스템 운영 (서비스 상태 실제 API 연동) ════════ */}
            {tab === 'system' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <p style={sl}>// SYSTEM OPERATIONS</p>
                      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.35rem', color: 'var(--text)', letterSpacing: '-0.03em' }}>시스템 운영</h2>
                    </div>
                    <button className="btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }} onClick={handleRefreshSystem}>
                      <RefreshCw size={13} style={{ animation: systemLoading ? 'spin 1s linear infinite' : 'none' }} /> 새로고침
                    </button>
                  </div>

                  {systemError && (
                      <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.83rem', color: '#ef4444' }}>
                        <AlertTriangle size={14} /> {systemError}
                      </div>
                  )}

                  {/* 서비스 상태 카드 — 실제 API */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                    {systemLoading || !systemHealth ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} style={{ ...card }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <div style={{ height: '14px', width: '100px', background: 'var(--border)', borderRadius: '4px' }} />
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)' }} />
                              </div>
                            </div>
                        ))
                    ) : systemHealth.services.map(api => {
                      const col = serviceColor(api.status);
                      return (
                          <div key={api.name} style={{ ...card, borderColor: col.border }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <p style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text)' }}>{api.name}</p>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.dot, animation: 'pulse 2s infinite' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1.25rem' }}>
                              <div>
                                <p style={{ ...sl, color: 'var(--text3)', marginBottom: '2px' }}>Latency</p>
                                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', color: col.text }}>{api.latency}</p>
                              </div>
                              <div>
                                <p style={{ ...sl, color: 'var(--text3)', marginBottom: '2px' }}>Success</p>
                                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', color: 'var(--text2)' }}>{api.rate}</p>
                              </div>
                            </div>
                            {systemHealth.checkedAt && (
                                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text3)', marginTop: '0.6rem' }}>
                                  확인: {systemHealth.checkedAt}
                                </p>
                            )}
                          </div>
                      );
                    })}
                  </div>

                  {/* 로그 필터 */}
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {(['ALL','ERROR','WARN','INFO'] as const).map(lv => (
                        <button key={lv} onClick={() => setSysFilter(lv)}
                                style={{ ...inp, cursor: 'pointer', padding: '0.45rem 1rem', fontSize: '0.72rem',
                                  background: sysFilter === lv ? 'rgba(79,124,255,0.12)' : 'var(--bg3)',
                                  border: sysFilter === lv ? '1px solid rgba(79,124,255,0.4)' : '1px solid var(--border)',
                                  color: sysFilter === lv ? 'var(--accent)' : 'var(--text2)',
                                  fontFamily: 'JetBrains Mono, monospace',
                                }}>
                          {lv}
                        </button>
                    ))}
                  </div>

                  {/* 시스템 로그 (실제 API 연동) */}
                  <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <p style={sl}>// SYSTEM LOGS</p>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '0.15rem 0.6rem', borderRadius: '5px' }}>
                        {filteredSys.length}건
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {filteredSys.length === 0 && (
                          <div style={{ padding: '1rem', background: 'var(--bg3)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text3)' }}>
                            표시할 시스템 로그가 없습니다.
                          </div>
                      )}
                      {filteredSys.map(log => {
                        const lv = levelStyle(log.level);
                        return (
                            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg3)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <span style={{ ...sl, color: lv.color, background: lv.bg, border: `1px solid ${lv.border}`, padding: '0.18rem 0.55rem', borderRadius: '5px', flexShrink: 0, marginTop: '1px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {log.level !== 'INFO' ? <AlertTriangle size={10} /> : <CheckCircle size={10} />} {log.level}
                        </span>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text3)', minWidth: '60px', marginTop: '2px' }}>{log.service}</span>
                              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text)', fontWeight: 300, lineHeight: 1.5 }}>{log.message}</span>
                              {log.count > 1 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: lv.color, background: lv.bg, padding: '0.15rem 0.5rem', borderRadius: '4px', flexShrink: 0 }}>×{log.count}</span>}
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--text3)', flexShrink: 0, marginTop: '2px' }}>{log.time}</span>
                            </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 빠른 실행 */}
                  <div style={card}>
                    <p style={{ ...sl, marginBottom: '1.25rem' }}>// QUICK ACTIONS</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                      {[
                        { label: 'STT 큐 비우기',      icon: <RefreshCw  size={14} />, color: 'var(--amber)'  },
                        { label: 'OpenAI 캐시 초기화', icon: <Database   size={14} />, color: 'var(--accent)' },
                        { label: '전체 로그 내보내기',  icon: <ChevronDown size={14} />, color: 'var(--green)' },
                      ].map(a => (
                          <button key={a.label} className="btn-ghost" style={{ padding: '0.75rem', justifyContent: 'center', gap: '0.5rem', color: a.color, borderColor: 'var(--border)' }}>
                            {a.icon} {a.label}
                          </button>
                      ))}
                    </div>
                  </div>
                </>
            )}
          </main>
        </div>
      </div>
  );
}
