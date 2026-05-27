// 파일 목적: LoginPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/auth/LoginPage.tsx
import { AuthLayout } from './AuthLayout';
import { AuthForm } from './AuthForm';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";

// 함수 목적: LoginPage 컴포넌트를 렌더링한다.
export function LoginPage() {
  const navigate = useNavigate();

  // 함수 목적: submit 처리를 담당한다.
  const handleSubmit = async (data: { email: string; password: string }) => {
    // 기존 코드 그대로 유지
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.message ?? err?.error ?? '로그인 실패');
        }
        const msg = await res.text().catch(() => '');
        throw new Error(msg || '로그인 실패');
      }

      const dataJson = await res.json();
      const accessToken =
        dataJson?.accessToken ?? dataJson?.token ?? dataJson?.jwt ??
        dataJson?.data?.accessToken ?? dataJson?.data?.token ?? null;

      if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('로그인 응답에 accessToken이 없습니다.');
      }

      const userObj = dataJson?.user ?? dataJson;
      localStorage.setItem('user', JSON.stringify({
        id:    userObj.id,
        email: userObj.email,
        name:  userObj.name,
        role:  userObj.role ?? 'USER',
      }));
      localStorage.setItem('accessToken', accessToken);
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      alert(e?.message ?? '로그인 중 오류가 발생했습니다.');
    }
  };

  // ✅ 추가: 소셜 로그인 → 백엔드 OAuth 엔드포인트로 이동
  const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
    window.location.href = `/oauth2/authorization/${provider}`;
    // Vite 프록시가 /oauth2/** → http://server:8080 으로 포워딩해줌
  };

  return (
    <AuthLayout title="로그인">
      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        onSocialLogin={handleSocialLogin}  // ✅ 연결
        onToggleMode={() => navigate('/signup')}
      />
      <div
          style={{
            marginTop: "14px",
            display: "flex",
            justifyContent: "center",
            gap: "8px",
          }}
      >
        <Link
            to="/find-id"
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text2)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
          아이디 찾기
        </Link>

        <Link
            to="/reset-password"
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text2)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
          비밀번호 찾기
        </Link>
      </div>
    </AuthLayout>
  );
}