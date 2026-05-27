// 파일 목적: NotFoundPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: src/pages/notfound/NotFoundPage.tsx
// 역할: 존재하지 않는 경로 접근 시(404) 안내 페이지
// 연결/흐름: App.tsx(Route) -> 이 페이지 -> lib/api.ts(api/*) -> /api/*(Spring Boot)

import { Link } from 'react-router-dom';

// 함수 목적: NotFoundPage 컴포넌트를 렌더링한다.
export function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white border rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-6">요청하신 주소가 없거나 이동되었습니다.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
