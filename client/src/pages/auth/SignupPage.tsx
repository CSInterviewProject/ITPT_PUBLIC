// 파일 목적: SignupPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/auth/SignupPage.tsx
// 역할: 회원가입 페이지(UI + 화면 로직)
// 연결/흐름: App.tsx(Route) -> 이 페이지 -> lib/api.ts(api/*) -> /api/*(Spring Boot)

import { AuthLayout } from './AuthLayout';
import { AuthForm } from './AuthForm';
import { useNavigate } from 'react-router-dom';

// SignUpPage: React 컴포넌트 렌더링
export function SignUpPage() {
  const navigate = useNavigate();

  // handleSubmit: 이벤트 처리(클릭/제출 등)
  const handleSubmit = async (data: { email: string; password: string; name?: string }) => {
    if (!data.name) {
      alert('이름을 입력해주세요.');
      return;
    }

    // ✅ 프록시(vite.config.ts)를 타도록 상대경로 사용 (/api -> 8080)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: data.password,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const err = await res.json().catch(() => null);
          const msg = err?.message ?? err?.error ?? '회원가입 실패';
          throw new Error(msg);
        }
        const msg = await res.text().catch(() => '');
        throw new Error(msg || '회원가입 실패');
      }

      const payload = await res.json();

      // ✅ 서버가 회원가입 시 accessToken을 같이 주는 경우도 대비
      // - accessToken이 있으면: 바로 로그인 상태로 저장 후 대시보드 이동
      // - accessToken이 없으면: 로그인 페이지로 보내서 토큰을 발급받게 함
      const accessToken = payload?.accessToken ?? payload?.token ?? null;
      if (accessToken) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: payload.id,
            email: payload.email,
            name: payload.name,
          }),
        );
        localStorage.setItem('accessToken', accessToken);
        navigate('/dashboard', { replace: true });
        return;
      }

      // ✅ 일반적인 흐름: 회원가입은 계정만 생성하고 토큰은 로그인에서 발급
      // (user만 저장해두면 RequireAuth가 통과할 수 있으므로 저장하지 않음)
      navigate('/login', { replace: true });
    } catch (e: any) {
      alert(e?.message ?? '회원가입 중 오류가 발생했습니다.');
    }
  };

  // handleSocialLogin: 이벤트 처리(클릭/제출 등)
  const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
    window.location.href = `/oauth2/authorization/${provider}`;
  };

  return (
    <AuthLayout>
      <AuthForm
        mode="signup"
        onSubmit={handleSubmit}
        onSocialLogin={handleSocialLogin}
        onToggleMode={() => navigate('/login')}
      />
    </AuthLayout>
  );
}
