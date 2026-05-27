// 파일 목적: auth 공용 헬퍼 로직을 포함한다.
// 위치: client/src/lib/auth.ts
// 역할: 공용 유틸/헬퍼 로직
// 연결/흐름: Page/Component -> 이 파일 -> /api/*(Spring Boot)

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type StoredUser = User & { password: string };

const USERS_KEY = "itpt_users_v1";
const AUTH_KEY = "itpt_auth_v1";

// hasWindow: 기능 단위 함수
function hasWindow() {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// loadUsers: 기능 단위 함수
function loadUsers(): StoredUser[] {
  if (!hasWindow()) return [];
  const data = safeParse<StoredUser[]>(localStorage.getItem(USERS_KEY));
  return Array.isArray(data) ? data : [];
}

// saveUsers: 기능 단위 함수
function saveUsers(users: StoredUser[]) {
  if (!hasWindow()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// genId: 기능 단위 함수
function genId() {
  if (hasWindow() && "crypto" in window && "randomUUID" in crypto) return crypto.randomUUID();
  return `u_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// setAuth: 기능 단위 함수
function setAuth(userId: string) {
  if (!hasWindow()) return;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId }));
}

// logout: 기능 단위 함수
export function logout() {
  if (!hasWindow()) return;
  localStorage.removeItem(AUTH_KEY);
}

// getCurrentUser: API 호출/데이터 로딩
export function getCurrentUser(): User | null {
  if (!hasWindow()) return null;
  const auth = safeParse<{ userId: string }>(localStorage.getItem(AUTH_KEY));
  if (!auth?.userId) return null;

  const users = loadUsers();
  const found = users.find((u) => u.id === auth.userId);
  if (!found) return null;

  // password 제외하고 반환
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...user } = found;
  return user;
}

// signup: 기능 단위 함수
export function signup(params: { name: string; email: string; password: string }): User {
  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (!name) throw new Error("이름을 입력해주세요.");
  if (!email) throw new Error("이메일을 입력해주세요.");
  if (!password || password.length < 4) throw new Error("비밀번호는 최소 4자 이상으로 입력해주세요.");

  const users = loadUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email);
  if (exists) throw new Error("이미 가입된 이메일입니다.");

  const user: User = {
    id: genId(),
    name,
    email,
    createdAt: new Date().toISOString(),
  };

  const stored: StoredUser = { ...user, password };
  saveUsers([stored, ...users]);

  return user;
}

// login: 기능 단위 함수
export function login(params: { email: string; password: string }): User {
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (!email) throw new Error("이메일을 입력해주세요.");
  if (!password) throw new Error("비밀번호를 입력해주세요.");

  const users = loadUsers();
  const found = users.find((u) => u.email.toLowerCase() === email);
  if (!found) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  if (found.password !== password) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");

  setAuth(found.id);

  // password 제외하고 반환
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...user } = found;
  return user;
}
