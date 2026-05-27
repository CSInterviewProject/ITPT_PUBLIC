// 파일 목적: password 공용 헬퍼 로직을 포함한다.
export const PASSWORD_POLICY_TEXT = '비밀번호는 8자 이상이며 특수문자를 1개 이상 포함해야 합니다.';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

// 함수 목적: password policy satisfied 여부를 확인한다.
export function isPasswordPolicySatisfied(password: string): boolean {
  return password.length >= 8 && SPECIAL_CHAR_REGEX.test(password);
}
