// 파일 목적: 이 파일의 역할을 정의한다.
// 위치: src/types/question.ts
// 역할: 공용 타입 정의

export type Question = {
  id: number;
  topic: string;
  subtopic: string;
  difficulty: number;
  questionText: string;
  modelAnswer: string;
  requiredKeywords: string[];
  optionalKeywords: string[];
};
