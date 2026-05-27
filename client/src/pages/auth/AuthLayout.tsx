// 파일 목적: AuthLayout 페이지 UI와 페이지 단위 상호작용을 정의한다.
// AuthLayOut.tsx — 테마 전환 지원

import { ReactNode } from 'react'
import { ThemeToggle } from '../../components/theme/ThemeToggle'

interface AuthLayoutProps { children: ReactNode }

// 함수 목적: AuthLayout 컴포넌트를 렌더링한다.
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="page-root" style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

      {/* 글로우 블롭 */}
      <div className="glow-blob glow-blob-primary"   style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="glow-blob glow-blob-secondary" style={{ bottom: '-100px', right: '-80px' }} />

      {/* 우상단 테마 토글 */}
      <div style={{ position: 'fixed', top: '1.25rem', right: '1.5rem', zIndex: 200 }}>
        <ThemeToggle size="sm" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>

        {/* 로고 */}
        <div className="anim-1" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="itpt-logo" style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>
            IT<span>PT</span>
          </div>
          <p className="section-label" style={{ justifyContent: 'center', display: 'flex' }}>
            // AI 기반 면접 연습
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text2)', fontWeight: 300, marginTop: '0.4rem' }}>
            AI 기반 CS 기술 면접 연습 플랫폼
          </p>
        </div>

        <div className="anim-2">{children}</div>

        <p className="anim-3" style={{ textAlign: 'center', marginTop: '1.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--text3)' }}>
            CS Interview Training Platform
        </p>
      </div>
    </div>
  )
}
