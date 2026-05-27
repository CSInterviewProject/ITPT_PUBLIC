// 파일 목적: LandingPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/landing/LandingPage.tsx
// 역할: 서비스 소개 랜딩 페이지 — 포트폴리오 스타일

import { ArrowRight, BookOpen, Database, Globe, Mic, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useIsMobile } from '../../components/ui/use-mobile';

const FEATURES = [
  {
    icon: <Mic size={18} />,
    color: 'blue',
    title: '음성 답변 & STT',
    desc: '브라우저 내장 MediaRecorder로 답변을 녹음하고, CLOVA Speech로 한국어 음성을 텍스트로 변환합니다.',
  },
  {
    icon: <Zap size={18} />,
    color: 'green',
    title: 'AI 실시간 채점',
    desc: 'GPT-4.1-mini가 정확성·키워드·구조를 다각도로 평가하고 0~100점 점수와 구체적인 피드백을 제공합니다.',
  },
  {
    icon: <BookOpen size={18} />,
    color: 'amber',
    title: '꼬리질문 자동 생성',
    desc: '답변의 약점을 분석해 맞춤형 꼬리질문을 자동 생성, 실전 면접처럼 연속 대화를 이어갑니다.',
  },
  {
    icon: <Database size={18} />,
    color: 'pink',
    title: '학습 진도 대시보드',
    desc: '카테고리별 평균 점수·점수 추이·Level 시스템으로 학습 진도를 한눈에 확인합니다.',
  },
];

const FLOW_STEPS = [
  { icon: '📝', name: '질문 출제', sub: 'DB Seed' },
  { icon: '🎙', name: '음성 녹음', sub: 'MediaRecorder' },
  { icon: '📄', name: 'STT 변환', sub: 'CLOVA Speech' },
  { icon: '✏️', name: '텍스트 검토', sub: 'Review UI' },
  { icon: '🤖', name: 'AI 채점', sub: 'GPT-4.1-mini' },
  { icon: '📊', name: '피드백 & 기록', sub: 'Score + History' },
];



const CATEGORIES = [
  { icon: <BookOpen size={16} />, label: 'OS', cls: 'blue' },
  { icon: <Globe size={16} />, label: 'Network', cls: 'green' },
  { icon: <Database size={16} />, label: 'Database', cls: 'amber' },
  { icon: <BookOpen size={16} />, label: '자료구조', cls: 'pink' },
  { icon: <BookOpen size={16} />, label: 'Spring', cls: 'green' },
  { icon: <Database size={16} />, label: 'JPA', cls: 'amber' },
  { icon: <BookOpen size={16} />, label: 'Java', cls: 'blue' },
  { icon: <BookOpen size={16} />, label: 'C', cls: 'green' },
  { icon: <BookOpen size={16} />, label: 'C++', cls: 'amber' },
  { icon: <BookOpen size={16} />, label: 'Python', cls: 'pink' },
];

// 함수 목적: LandingPage 컴포넌트를 렌더링한다.
export function LandingPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const sl: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.72rem',
    color: 'var(--accent)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
  };

  return (
    <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh', overflowX: 'hidden' }}>

      {/* 배경 글로우 */}
      <div className="glow-blob glow-blob-primary"   style={{ top: '-80px', left: '40%', transform: 'translateX(-50%)' }} />
      <div className="glow-blob glow-blob-secondary" style={{ top: '30%', right: '-120px' }} />
      <div className="glow-blob" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle,rgba(124,92,255,0.06) 0%,transparent 70%)', bottom: '10%', left: '-100px' }} />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.9rem 1rem' : '1.1rem 3rem',
        gap: isMobile ? '0.75rem' : undefined,
        flexWrap: isMobile ? 'wrap' : undefined,
        background: 'var(--header-bg)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.3s',
      }}>
        <div className="itpt-logo" style={{ fontSize: '1.1rem' }}>IT<span>PT</span></div>

        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '2rem' }}>
          {['기능', '동작 흐름'].map(t => (
            <a key={t} href={`#${t}`} style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem',
              color: 'var(--text2)', textDecoration: 'none', letterSpacing: '0.02em',
              transition: 'color 0.2s',
            }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseOut={e  => (e.currentTarget.style.color = 'var(--text2)')}
            >{t}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <ThemeToggle size="sm" />
          <button className="btn-ghost" style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 1.1rem', fontSize: '0.82rem' }}
            onClick={() => navigate('/login')}>로그인</button>
          <button className="btn-primary" style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 1.1rem', fontSize: '0.82rem' }}
            onClick={() => navigate('/signup')}>
            시작하기 <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', alignItems: 'center', padding: isMobile ? '7.25rem 1rem 3rem' : '8rem 3rem 5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ maxWidth: '780px' }}>
          <div className="itpt-badge anim-1" style={{ marginBottom: '2rem' }}>
            AI-POWERED INTERVIEW PRACTICE
          </div>

          <h1 className="anim-2" style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>
            CS 면접을<br />
            <span className="gradient-text">AI와 함께</span>
          </h1>

          <p className="anim-3" style={{ fontSize: isMobile ? '1rem' : '1.15rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.8, maxWidth: '560px', marginBottom: '2.5rem' }}>
            음성으로 답변하고, AI가 실시간으로 채점합니다.<br />
            OS · 네트워크 · DB · 자료구조 — 기술 면접의 모든 것을 한 곳에서.
          </p>

          <div className="anim-4" style={{ display: 'flex', gap: '0.75rem', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : undefined }}>
            <button className="btn-primary" style={{ fontSize: '1rem', padding: isMobile ? '0.85rem 1rem' : '0.85rem 2rem', width: isMobile ? '100%' : undefined, justifyContent: 'center' }}
              onClick={() => navigate('/signup')}>
              시작하기 <ArrowRight size={16} />
            </button>
            <button className="btn-ghost" style={{ fontSize: '0.95rem', padding: isMobile ? '0.85rem 1rem' : '0.85rem 1.75rem', width: isMobile ? '100%' : undefined, justifyContent: 'center' }}
              onClick={() => navigate('/login')}>
              로그인
            </button>
          </div>
        </div>
      </section>

      {/* ── NUMBERS ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '0 1rem 3rem' : '0 3rem 5rem' }}>
        <div className="numbers-grid" style={{ gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4,1fr)' }}>
          {[
            { v: String(CATEGORIES.length), l: 'CS 카테고리' },
            { v: 'STT', l: '음성→텍스트 변환' },
            { v: 'AI', l: '실시간 채점 & 피드백' },
            { v: '∞', l: '꼬리질문 자동 생성' },
          ].map(n => (
            <div key={n.v} className="number-cell">
              <span className="number-val">{n.v}</span>
              <p className="number-label">{n.l}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ width: '100%', height: '1px', background: 'var(--border)', maxWidth: '1100px', margin: '0 auto' }} />

      {/* ── FEATURES ── */}
      <section id="기능" style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '4rem 1rem' : '7rem 3rem' }}>
        <p style={sl}>// FEATURES</p>
        <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>무엇을 만들었나요</h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.8, maxWidth: '560px', marginBottom: '4rem' }}>
          IT 취업을 준비하는 개발자를 위한 AI 기반 기술 면접 연습 플랫폼입니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '1.25rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} className="dark-card" style={{ padding: '2rem' }}>
              <div className={`card-icon ${f.color}`} style={{ marginBottom: '1.25rem' }}>{f.icon}</div>
              <h3 style={{ color: 'var(--text)', marginBottom: '0.6rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ width: '100%', height: '1px', background: 'var(--border)', maxWidth: '1100px', margin: '0 auto' }} />

      {/* ── CATEGORIES ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '4rem 1rem' : '7rem 3rem' }}>
        <p style={sl}>// CATEGORIES</p>
        <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>{CATEGORIES.length}개 CS/개발 카테고리</h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.8, maxWidth: '560px', marginBottom: '4rem' }}>
          기본 CS 4개(OS/Network/Database/자료구조)와 백엔드·언어 영역을 포함해
          총 {CATEGORIES.length}개 카테고리를 다룹니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5,1fr)', gap: '1rem' }}>
          {CATEGORIES.map(c => (
            <div key={c.label} className="dark-card" style={{ padding: '1.75rem', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/signup')}>
              <div className={`card-icon ${c.cls}`} style={{ margin: '0 auto 1rem auto' }}>{c.icon}</div>
              <h3 style={{ color: 'var(--text)', marginBottom: '0.75rem' }}>{c.label}</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500 }}>
                시작하기 <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ width: '100%', height: '1px', background: 'var(--border)', maxWidth: '1100px', margin: '0 auto' }} />

      {/* ── FLOW ── */}
      <section id="동작 흐름" style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '4rem 1rem' : '7rem 3rem' }}>
        <p style={sl}>// USER FLOW</p>
        <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>어떻게 동작하나요</h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.8, marginBottom: '4rem' }}>
          음성이 AI 피드백이 되기까지의 6단계 흐름입니다.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '1rem' }}>
          {FLOW_STEPS.map((s, i) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '130px', textAlign: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  border: '1px solid var(--border2)', background: 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '0.75rem',
                }}>{s.icon}</div>
                <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.2rem' }}>{s.name}</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.66rem', color: 'var(--text3)' }}>{s.sub}</p>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: 'var(--border2)', minWidth: '30px', position: 'relative', marginBottom: '2.2rem' }}>
                  <span style={{ position: 'absolute', right: '-1px', top: '-4px', borderLeft: '5px solid var(--border2)', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '0 1rem 5rem' : '0 3rem 10rem' }}>
        <div className="dark-card" style={{
          padding: isMobile ? '2.5rem 1.25rem' : '4rem 3rem', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(79,124,255,0.08) 0%, rgba(124,92,255,0.06) 100%)',
          border: '1px solid rgba(79,124,255,0.2)',
        }}>
          <p style={{ ...sl, justifyContent: 'center', display: 'flex' }}>// GET STARTED</p>
          <h2 style={{ color: 'var(--text)', marginBottom: '1rem', fontSize: 'clamp(1.75rem,3vw,2.5rem)' }}>
            시작하기
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text2)', fontWeight: 300, lineHeight: 1.8, marginBottom: '2.5rem' }}>
            회원가입 후 이용할 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
            <button className="btn-primary" style={{ fontSize: '1rem', padding: isMobile ? '0.85rem 1rem' : '0.85rem 2.5rem', justifyContent: 'center' }}
              onClick={() => navigate('/signup')}>
              회원가입 <ArrowRight size={16} />
            </button>
            <button className="btn-ghost" style={{ fontSize: '0.95rem', padding: isMobile ? '0.85rem 1rem' : '0.85rem 2rem', justifyContent: 'center' }}
              onClick={() => navigate('/login')}>
              로그인
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: isMobile ? '2rem 1rem' : '3rem',
        display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.5rem' : undefined,
        position: 'relative', zIndex: 1,
      }}>
        <p className="itpt-logo" style={{ fontSize: '1rem' }}>IT<span>PT</span></p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text3)' }}>
          AI 기반 CS 면접 연습 플랫폼
        </p>
      </footer>
    </div>
  );
}
