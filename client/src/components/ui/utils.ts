// 파일 목적: utils용 재사용 UI 프리미티브를 정의한다.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 함수 목적: cn 로직을 구현한다.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
