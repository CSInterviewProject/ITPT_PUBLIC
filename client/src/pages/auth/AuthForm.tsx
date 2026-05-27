// 파일 목적: AuthForm 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: client/src/pages/auth/AuthForm.tsx
import { useEffect, useMemo, useState } from 'react'
import { isPasswordPolicySatisfied, PASSWORD_POLICY_TEXT } from '../../lib/password'

type AuthMode = 'login' | 'signup'

interface AuthFormProps {
  mode: AuthMode
  onSubmit: (data: { email: string; password: string; name?: string }) => void
  onSocialLogin?: (provider: string) => void
  onToggleMode: () => void
}

// 함수 목적: AuthForm 컴포넌트를 렌더링한다.
export function AuthForm({ mode, onSubmit, onSocialLogin, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)

  const uiText = useMemo(() => {
    const isLogin = mode === 'login'
    return {
      title: isLogin ? '로그인' : '회원가입',
      submit: isLogin ? '로그인' : '회원가입',
      toggle: isLogin ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인',
    }
  }, [mode])

  const inputClassName =
      'mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-300'

  // 함수 목적: caps lock state를 갱신한다.
  const updateCapsLockState = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'))
  }

  // 함수 목적: password blur 처리를 담당한다.
  const handlePasswordBlur = () => {
    setIsCapsLockOn(false)
  }

  useEffect(() => {
    if (mode !== 'signup') {
      setConfirmPassword('')
    }
    setIsCapsLockOn(false)
  }, [mode])

  const isPasswordMismatch =
      mode === 'signup' &&
      confirmPassword.length > 0 &&
      password !== confirmPassword

  const isPasswordMatch =
      mode === 'signup' &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword

  // 함수 목적: input data 유효성을 검증한다.
  const validate = () => {
    if (!email.trim()) {
      alert('이메일을 입력해주세요.')
      return false
    }

    if (!password.trim()) {
      alert('비밀번호를 입력해주세요.')
      return false
    }

    if (mode === 'signup' && !name.trim()) {
      alert('이름을 입력해주세요.')
      return false
    }

    if (mode === 'signup' && !confirmPassword.trim()) {
      alert('비밀번호 확인을 입력해주세요.')
      return false
    }

    if (mode === 'signup' && !isPasswordPolicySatisfied(password)) {
      alert(PASSWORD_POLICY_TEXT)
      return false
    }

    if (mode === 'signup' && password !== confirmPassword) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return false
    }

    return true
  }

  // 함수 목적: submit 처리를 담당한다.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      email: email.trim(),
      password,
      ...(mode === 'signup' ? { name: name.trim() } : {}),
    })
  }

  return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">{uiText.title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {mode === 'login' ? '기존 계정으로 로그인하세요.' : '새 계정을 생성하세요.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">이름</label>
                <input
                    className={inputClassName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    autoComplete="name"
                />
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">이메일</label>
            <input
                className={inputClassName}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
                className={inputClassName}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={updateCapsLockState}
                onKeyUp={updateCapsLockState}
                onBlur={handlePasswordBlur}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {mode === 'signup' && (
              <p className="mt-1 text-xs text-gray-500">{PASSWORD_POLICY_TEXT}</p>
            )}
          </div>

          {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
                <input
                    className={inputClassName}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={updateCapsLockState}
                    onKeyUp={updateCapsLockState}
                    onBlur={handlePasswordBlur}
                    placeholder="비밀번호를 다시 입력하세요"
                    autoComplete="new-password"
                />

                {isPasswordMismatch && (
                    <p className="mt-1 text-sm font-medium text-red-500">
                      비밀번호가 일치하지 않습니다.
                    </p>
                )}

                {isPasswordMatch && (
                    <p className="mt-1 text-sm font-medium text-green-600">
                      비밀번호가 일치합니다.
                    </p>
                )}
              </div>
          )}

          {isCapsLockOn && (
              <p className="text-sm font-medium text-amber-600">
                Caps Lock이 켜져 있습니다.
              </p>
          )}

          <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            {uiText.submit}
          </button>

          {onSocialLogin && (
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs text-gray-400">또는</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => onSocialLogin('google')}
                  >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        className="h-4 w-4"
                        alt=""
                    />
                    Google로 계속하기
                  </button>

                  <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-3 py-2 text-sm font-medium text-[#3C1E1E] hover:brightness-95"
                      onClick={() => onSocialLogin('kakao')}
                  >
                    카카오로 계속하기
                  </button>

                  <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#03C75A] px-3 py-2 text-sm font-medium text-white hover:brightness-95"
                      onClick={() => onSocialLogin('naver')}
                  >
                    네이버로 계속하기
                  </button>
                </div>
              </div>
          )}

          <button
              type="button"
              className="w-full rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              onClick={onToggleMode}
          >
            {uiText.toggle}
          </button>
        </form>
      </div>
  )
}
