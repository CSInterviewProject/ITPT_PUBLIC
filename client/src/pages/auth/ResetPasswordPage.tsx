// 파일 목적: ResetPasswordPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: client/src/pages/auth/ResetPasswordPage.tsx
// 역할: AuthLayout 안에 ResetPasswordForm을 넣고 API 호출을 연결하는 페이지.

import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { ResetPasswordForm } from './ResetPasswordForm'
import {
  resetPassword,
  sendResetPasswordCode,
  verifyResetPasswordCode,
} from '@/lib/api'

// 함수 목적: ResetPasswordPage 컴포넌트를 렌더링한다.
export default function ResetPasswordPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      <ResetPasswordForm
        onSendCode={async ({ email }) => {
          try {
            await sendResetPasswordCode(email)
            alert('인증번호를 전송했습니다.')
          } catch (error: any) {
            alert(error?.response?.data?.message || '인증번호 전송에 실패했습니다.')
          }
        }}
        onVerifyCode={async ({ email, code }) => {
          try {
            await verifyResetPasswordCode(email, code)
            alert('이메일 인증이 완료되었습니다.')
          } catch (error: any) {
            alert(error?.response?.data?.message || '인증번호 확인에 실패했습니다.')
            throw error
          }
        }}
        onResetPassword={async ({ email, newPassword }) => {
          try {
            await resetPassword(email, newPassword)
            alert('비밀번호가 변경되었습니다.')
            navigate('/login')
          } catch (error: any) {
            alert(error?.response?.data?.message || '비밀번호 변경에 실패했습니다.')
          }
        }}
        onGoLogin={() => navigate('/login')}
      />
    </AuthLayout>
  )
}