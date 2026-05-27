// 파일 목적: OAuthCallbackPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/auth/OAuthCallbackPage.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// 함수 목적: OAuthCallbackPage 컴포넌트를 렌더링한다.
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false); // ✅ StrictMode 이중 실행 방지

  useEffect(() => {
    if (handled.current) return; // 이미 처리됐으면 무시
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      alert('소셜 로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      // ✅ 한글 등 유니코드 대응 디코딩
      const base64 = token.split('.')[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/');
      const payload = JSON.parse(
          decodeURIComponent(
              atob(base64)
                  .split('')
                  .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
          )
      );

      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify({
        id:       payload.uid,
        email:    payload.sub,
        name:     payload.name,
        role:     payload.role?.replace('ROLE_', '') ?? 'USER',
        provider: payload.provider ?? 'local',
      }));

      navigate('/dashboard', { replace: true });
    } catch (e) {
      console.error('토큰 파싱 실패:', e);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
      <div className="flex h-[100dvh] items-center justify-center">
        <p className="text-gray-500 text-sm">로그인 처리 중...</p>
      </div>
  );
}
