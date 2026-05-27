// 파일 목적: 클라이언트 앱 라우팅, 인증 가드, 최상위 프로바이더를 구성한다.
// 위치: src/App.tsx
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignupPage';
import FindIdPage from './pages/auth/FindIdPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { Dashboard } from './pages/dashboard/DashboardPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { InterviewSession } from './pages/interview/InterviewSessionPage';
import { InterviewQuestionStudyPage } from './pages/study/InterviewQuestionStudyPage';
import { AdminPage } from './pages/admin/AdminPage';
import { NotFoundPage } from './pages/notfound/NotFoundPage';
import { OAuthCallbackPage } from './pages/auth/OAuthCallbackPage';
import { getAccessToken, getStoredUser as getStoredUserFromApi } from './lib/api';

// 함수 목적: authed 여부를 확인한다.
function isAuthed() {
  return !!getStoredUserFromApi() && !!getAccessToken();
}

// 함수 목적: admin 여부를 확인한다.
function isAdmin() {
  try {
    const u = JSON.parse(localStorage.getItem('user') ?? '{}');
    return u?.role === 'ADMIN';
  } catch {
    return false;
  }
}

// 함수 목적: RequireAuth 컴포넌트를 렌더링한다.
function RequireAuth() {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// 함수 목적: RequireAdmin 컴포넌트를 렌더링한다.
function RequireAdmin() {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// 함수 목적: RedirectIfAuthed 컴포넌트를 렌더링한다.
function RedirectIfAuthed() {
  if (isAuthed()) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// 함수 목적: App 컴포넌트를 렌더링한다.
export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={isAuthed() ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />

        {/* OAuth 콜백은 인증 여부와 상관없이 항상 접근 가능해야 함 */}
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/find-id" element={<FindIdPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/study/questions" element={<InterviewQuestionStudyPage />} />
          <Route path="/interview/:category" element={<InterviewSession />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
