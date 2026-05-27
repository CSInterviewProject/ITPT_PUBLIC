// 파일 목적: 테마 컨텍스트의 상태와 프로바이더 로직을 정의한다.
// 위치: src/contexts/ThemeContext.tsx
// 역할: 다크/화이트 테마 전역 상태 관리

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  setTheme: () => {},
});

// 함수 목적: ThemeProvider 컴포넌트를 렌더링한다.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('itpt-theme') as Theme) ?? 'dark';
  });

  useEffect(() => {
    // data-theme 속성으로 CSS 변수 전환
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('itpt-theme', theme);
  }, [theme]);

  // 함수 목적: theme를 설정한다.
  const setTheme = (t: Theme) => setThemeState(t);
  // 함수 목적: toggle 로직을 구현한다.
  const toggle = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 함수 목적: theme 상태를 관리하는 커스텀 훅이다.
export const useTheme = () => useContext(ThemeContext);