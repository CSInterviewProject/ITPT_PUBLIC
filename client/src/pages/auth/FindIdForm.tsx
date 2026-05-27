// 파일 목적: FindIdForm 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: client/src/pages/auth/FindIdForm.tsx
// 역할: 로그인/회원가입과 동일한 카드 스타일로 아이디(로그인 이메일) 찾기 UI를 제공하는 폼 컴포넌트.

import { useState } from 'react'
import { Link } from 'react-router-dom'

interface FindIdFormProps {
  onSendCode: (data: { name: string; email: string }) => void | Promise<void>
  onVerifyCode: (data: { email: string; code: string }) => void | Promise<void>
  onFindId: (data: { name: string; email: string }) => void | Promise<void>
  onGoLogin: () => void
  result?: string
}

// 함수 목적: FindIdForm 컴포넌트를 렌더링한다.
export function FindIdForm({
  onSendCode,
  onVerifyCode,
  onFindId,
  onGoLogin,
  result,
}: FindIdFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState(false)

  // 함수 목적: send code 유효성을 검증한다.
  const validateSendCode = () => {
    if (!name.trim()) {
      alert('이름을 입력해주세요.')
      return false
    }
    if (!email.trim()) {
      alert('이메일을 입력해주세요.')
      return false
    }
    return true
  }

  // 함수 목적: verify code 유효성을 검증한다.
  const validateVerifyCode = () => {
    if (!email.trim()) {
      alert('이메일을 입력해주세요.')
      return false
    }
    if (!code.trim()) {
      alert('인증번호를 입력해주세요.')
      return false
    }
    return true
  }

  // 함수 목적: send code 처리를 담당한다.
  const handleSendCode = async () => {
    if (!validateSendCode()) return
    await onSendCode({ name: name.trim(), email: email.trim() })
  }

  // 함수 목적: verify code 처리를 담당한다.
  const handleVerifyCode = async () => {
    if (!validateVerifyCode()) return
    await onVerifyCode({ email: email.trim(), code: code.trim() })
    setVerified(true)
  }

  // 함수 목적: find id 처리를 담당한다.
  const handleFindId = async () => {
    if (!validateSendCode()) return
    if (!verified) {
      alert('이메일 인증을 먼저 완료해주세요.')
      return
    }
    await onFindId({ name: name.trim(), email: email.trim() })
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900">아이디 찾기</h2>
      <p className="mt-1 text-sm text-gray-500">
        이름과 이메일 인증으로 로그인 이메일을 확인하세요.
      </p>

      <div className="mt-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">이름</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
          />
        </div>

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

        <button
          type="button"
          className={`w-full rounded-xl px-4 py-2.5 text-white font-semibold ${
            verified ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleFindId}
          disabled={!verified}
        >
          아이디 찾기
        </button>

        {result && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            회원님의 로그인 이메일은 <span className="font-semibold">{result}</span> 입니다.
          </div>
        )}

        <button
          type="button"
          className="w-full rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          onClick={onGoLogin}
        >
          로그인으로 돌아가기
        </button>

        <div className="text-center">
          <Link to="/reset-password" className="text-sm text-gray-500 hover:underline">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  )
}