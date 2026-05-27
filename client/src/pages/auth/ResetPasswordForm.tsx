// 파일 목적: ResetPasswordForm 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: client/src/pages/auth/ResetPasswordForm.tsx
// 역할: 로그인/회원가입과 동일한 카드 스타일로 비밀번호 재설정 UI를 제공하는 폼 컴포넌트.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isPasswordPolicySatisfied, PASSWORD_POLICY_TEXT } from '../../lib/password'

interface ResetPasswordFormProps {
  onSendCode: (data: { email: string }) => void | Promise<void>
  onVerifyCode: (data: { email: string; code: string }) => void | Promise<void>
  onResetPassword: (data: { email: string; newPassword: string }) => void | Promise<void>
  onGoLogin: () => void
}

// 함수 목적: ResetPasswordForm 컴포넌트를 렌더링한다.
export function ResetPasswordForm({
  onSendCode,
  onVerifyCode,
  onResetPassword,
  onGoLogin,
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [verified, setVerified] = useState(false)

  // 함수 목적: email 유효성을 검증한다.
  const validateEmail = () => {
    if (!email.trim()) {
      alert('이메일을 입력해주세요.')
      return false
    }
    return true
  }

  // 함수 목적: send code 처리를 담당한다.
  const handleSendCode = async () => {
    if (!validateEmail()) return
    await onSendCode({ email: email.trim() })
  }

  // 함수 목적: verify code 처리를 담당한다.
  const handleVerifyCode = async () => {
    if (!validateEmail()) return
    if (!code.trim()) {
      alert('인증번호를 입력해주세요.')
      return
    }

    await onVerifyCode({ email: email.trim(), code: code.trim() })
    setVerified(true)
  }

  // 함수 목적: reset password 처리를 담당한다.
  const handleResetPassword = async () => {
    if (!verified) {
      alert('이메일 인증을 먼저 완료해주세요.')
      return
    }
    if (!newPassword.trim()) {
      alert('새 비밀번호를 입력해주세요.')
      return
    }
    if (!isPasswordPolicySatisfied(newPassword)) {
      alert(PASSWORD_POLICY_TEXT)
      return
    }
    if (newPassword !== newPasswordConfirm) {
      alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    await onResetPassword({ email: email.trim(), newPassword })
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900">비밀번호 재설정</h2>
      <p className="mt-1 text-sm text-gray-500">
        이메일 인증 후 새 비밀번호를 설정하세요.
      </p>

      <div className="mt-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
          />
        </div>

        <button
          type="button"
          className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-white font-semibold hover:bg-indigo-700"
          onClick={handleSendCode}
        >
          인증번호 보내기
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700">인증번호</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6자리 인증번호"
            autoComplete="one-time-code"
          />
        </div>

        <button
          type="button"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={handleVerifyCode}
        >
          인증 확인
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-gray-500">{PASSWORD_POLICY_TEXT}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        <button
          type="button"
          className={`w-full rounded-xl px-4 py-2.5 text-white font-semibold ${
            verified ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleResetPassword}
          disabled={!verified}
        >
          비밀번호 변경
        </button>

        <button
          type="button"
          className="w-full rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          onClick={onGoLogin}
        >
          로그인으로 돌아가기
        </button>

        <div className="text-center">
          <Link to="/find-id" className="text-sm text-gray-500 hover:underline">
            아이디 찾기
          </Link>
        </div>
      </div>
    </div>
  )
}
