// 파일 목적: 테마 관련 UI 컴포넌트와 제어 기능을 제공한다.
// 위치: src/components/theme/ThemeToggle.tsx
// 역할: 다크/라이트 테마 전환 버튼 (헤더에 삽입)

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  /** 버튼 크기 변형 */
  size?: 'sm' | 'md';
}

// 함수 목적: ThemeToggle 컴포넌트를 렌더링한다.
export function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const pad   = size === 'sm' ? '0.4rem 0.75rem' : '0.55rem 1rem';
  const fsize = size === 'sm' ? '0.75rem' : '0.82rem';
  const isize = size === 'sm' ? 13 : 15;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: pad,
        background: isDark
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.05)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.12)'
          : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '9px',
        color: isDark ? 'var(--text2)' : 'var(--text2)',
        fontSize: fsize,
        fontFamily: 'JetBrains Mono, monospace',
        cursor: 'pointer',
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = isDark
          ? 'rgba(255,255,255,0.22)'
          : 'rgba(0,0,0,0.18)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = isDark
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(0,0,0,0.1)';
      }}
    >
      {isDark
        ? <><Sun size={isize} /> Light</>
        : <><Moon size={isize} /> Dark</>
      }
    </button>
  );
}