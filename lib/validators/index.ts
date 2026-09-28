import { z } from "zod";

export const staffLoginSchema = z.object({
  mode: z.literal("staff").default("staff"),
  email: z.string().email(),
  password: z.string().min(6),
});

export const studentLoginSchema = z.object({
  mode: z.literal("student"),
  studentId: z.string().min(3),
  password: z.string().min(6),
});

export const loginSchema = z.discriminatedUnion("mode", [
  staffLoginSchema.extend({ mode: z.literal("staff") }),
  studentLoginSchema,
]);

export const institutionSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  plan: z.enum(["STARTER", "GROWTH", "CAMPUS"]).optional(),
});

export const adminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  institutionId: z.string().min(1),
});

export const classSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(2),
  description: z.string().optional(),
  academicYear: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"]),
  groupName: z.string().min(1).max(80),
  section: z.string().max(40).optional(),
  program: z.string().max(100).optional(),
});

export const classCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(1000).optional(),
  academicYear: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"]),
  groupName: z.string().trim().min(1).max(80),
  section: z.string().trim().max(40).optional(),
  subjectIds: z
    .array(z.string().min(1))
    .min(1, "Please select at least one subject.")
    .transform((ids) => [...new Set(ids)]),
});

export const studentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  classId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().max(32).optional(),
  guardianName: z.string().max(120).optional(),
  guardianPhone: z.string().max(32).optional(),
  address: z.string().max(500).optional(),
  academicYear: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"]).optional(),
  rollNumber: z.string().max(40).optional(),
});

export const studentUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const syllabusSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(2),
  content: z.string().min(8),
  inputType: z.enum(["TOPIC", "TEXT", "IMAGE", "PDF"]).default("TEXT"),
});

export const questionSchema = z.object({
  classId: z.string().min(1),
  syllabusId: z.string().optional(),
  topicId: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  questionText: z.string().min(8),
  explanation: z.string().optional(),
  options: z.array(z.object({ key: z.string(), text: z.string().min(1) })).length(4),
  correctAnswer: z.string().min(1),
});

export const testSchema = z.object({
  classId: z.string().min(1),
  syllabusId: z.string().optional(),
  title: z.string().min(2),
  durationMinutes: z.number().int().min(5).max(300).default(30),
  totalQuestions: z.number().int().min(1).max(200).default(10),
  questionIds: z.array(z.string()).optional(),
});

export const assignmentSchema = z.object({
  testId: z.string().min(1),
  studentIds: z.array(z.string()).optional(),
  entireClass: z.boolean().optional(),
});

export const answerSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  selectedAnswer: z.string().nullable(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  currentQuestionIndex: z.number().int().min(0).optional(),
});

export const examSchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  title: z.string().min(2),
  syllabusId: z.string().optional(),
  topicText: z.string().optional(),
  content: z.string().optional(),
  questionCount: z.number().int().min(1).max(200),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  mixed: z.boolean().optional(),
  variationCount: z.number().int().min(1).max(8).default(3),
  durationMinutes: z.number().int().min(5).max(300),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
});

export const generateQuestionsSchema = z.object({
  classId: z.string().min(1),
  count: z.number().int().min(1).max(100).default(5),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  topicName: z.string().optional(),
});
