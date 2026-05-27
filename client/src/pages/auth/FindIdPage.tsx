// 파일 목적: FindIdPage 페이지 UI와 페이지 단위 상호작용을 정의한다.
// 위치: client/src/pages/auth/FindIdPage.tsx
// 역할: AuthLayout 안에 FindIdForm을 넣고 API 호출을 연결하는 페이지.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { FindIdForm } from './FindIdForm'
import { findId, sendFindIdCode, verifyFindIdCode } from '@/lib/api'

// 함수 목적: FindIdPage 컴포넌트를 렌더링한다.
export default function FindIdPage() {
  const navigate = useNavigate()
  const [result, setResult] = useState('')

  return (
    <AuthLayout>
      <FindIdForm
        result={result}
        onSendCode={async ({ name, email }) => {
          try {
            await sendFindIdCode(name, email)
            alert('인증번호를 전송했습니다.')
          } catch (error: any) {
            alert(error?.response?.data?.message || '인증번호 전송에 실패했습니다.')
          }
        }}
        onVerifyCode={async ({ email, code }) => {
          try {
            await verifyFindIdCode(email, code)
            alert('이메일 인증이 완료되었습니다.')
          } catch (error: any) {
            alert(error?.response?.data?.message || '인증번호 확인에 실패했습니다.')
            throw error
          }
        }}
        onFindId={async ({ name, email }) => {
          try {
            const response = await findId(name, email)
            setResult(response.data.loginId)
          } catch (error: any) {
            alert(error?.response?.data?.message || '아이디 찾기에 실패했습니다.')
          }
        }}
        onGoLogin={() => navigate('/login')}
      />
    </AuthLayout>
  )
}