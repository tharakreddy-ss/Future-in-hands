import type {
  AssignmentStatus,
  AttemptStatus,
  Difficulty,
  InstitutionStatus,
  Plan,
  Role,
  StudentStatus,
  SubscriptionStatus,
  TestStatus,
} from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  institutionId: string | null;
  studentId: string | null;
  studentIdentifier: string | null;
};

export type SyllabusAnalysis = {
  summary: string;
  topics: Array<{ name: string; weightage: number; subtopics: string[] }>;
};

export type QuestionOption = {
  key: string;
  text: string;
};

export type GeneratedQuestionDraft = {
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  topicName?: string;
  subtopic?: string;
  syllabusReference?: string;
};

export type TopicScore = {
  topic: string;
  correct: number;
  total: number;
};

export type TestDistribution = {
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
  topicPercents: Array<{ topic: string; percent: number }>;
};

export type { AssignmentStatus, AttemptStatus, Difficulty, InstitutionStatus, Plan, Role, StudentStatus, SubscriptionStatus, TestStatus };
