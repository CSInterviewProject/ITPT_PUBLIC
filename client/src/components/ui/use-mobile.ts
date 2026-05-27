// 파일 목적: use-mobile용 재사용 UI 프리미티브를 정의한다.
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// 함수 목적: is mobile 상태를 관리하는 커스텀 훅이다.
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    // 함수 목적: on change 로직을 구현한다.
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
