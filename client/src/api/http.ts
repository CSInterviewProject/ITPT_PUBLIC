// 파일 목적: http 기능용 API 요청 헬퍼를 제공한다.
// 위치: src/api/http.ts
// 역할: 백엔드 API 호출(axios/fetch) 유틸 함수
// 연결/흐름: Page/Component -> 이 파일 -> /api/*(Spring Boot)

import axios from "axios";

export const http = axios.create({
  baseURL: "",
});

// ✅ 모든 요청에 Bearer 자동 첨부
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
