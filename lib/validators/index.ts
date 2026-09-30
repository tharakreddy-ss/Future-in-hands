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
  password: z.string({ error: "An initial password is required." }).min(6, "Initial password must be at least 6 characters."),
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

export const STAFF_CATEGORIES = ["TEACHING", "NON_TEACHING", "LIBRARY", "SECURITY", "MANAGEMENT", "OTHER"] as const;
export const STAFF_STATUSES = ["ACTIVE", "INACTIVE"] as const;

const staffCategory = z.enum(STAFF_CATEGORIES, {
  error: `Category must be one of: ${STAFF_CATEGORIES.join(", ")}.`,
});
const staffStatus = z.enum(STAFF_STATUSES, { error: "Status must be ACTIVE or INACTIVE." });

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

/** undefined = leave unchanged, null or "" = clear. */
const staffText = (label: string, max: number) =>
  z.preprocess(
    blankToNull,
    z.string({ error: `${label} must be text.` }).trim().max(max, `${label} must be at most ${max} characters.`).nullish(),
  );

const staffDate = (label: string, { past = false } = {}) =>
  z.preprocess(
    blankToNull,
    z
      .string({ error: `${label} must be a date.` })
      .nullish()
      .transform((value, ctx) => {
        if (value == null) return value;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          ctx.addIssue({ code: "custom", message: `${label} is not a valid date.` });
          return z.NEVER;
        }
        if (past && date.getTime() > Date.now()) {
          ctx.addIssue({ code: "custom", message: `${label} cannot be in the future.` });
          return z.NEVER;
        }
        return date;
      }),
  );

const staffRequiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

const staffNumber = staffRequiredText("Staff number", 40)
  .regex(/^[A-Za-z0-9][A-Za-z0-9\-/_.]*$/, "Staff number may only contain letters, numbers, - / _ and .")
  .transform((value) => value.toUpperCase());

const staffFields = {
  staffNumber,
  firstName: staffRequiredText("First name", 80),
  lastName: staffRequiredText("Last name", 80),
  category: staffCategory,
  designation: staffRequiredText("Designation", 120),
  department: staffText("Department", 120),
  qualification: staffText("Qualification", 200),
  email: z.preprocess(
    blankToNull,
    z.string({ error: "Email must be text." }).trim().toLowerCase().email("Email is not valid.").max(254).nullish(),
  ),
  phone: staffText("Phone", 32),
  dateOfBirth: staffDate("Date of birth", { past: true }),
  gender: staffText("Gender", 32),
  joiningDate: staffDate("Joining date"),
  address: staffText("Address", 500),
  emergencyContactName: staffText("Emergency contact name", 120),
  emergencyContactPhone: staffText("Emergency contact phone", 32),
  emergencyContactRelation: staffText("Emergency contact relation", 60),
};

/** Unknown keys (institutionId, userId, status, photoKey, ...) are stripped. */
export const staffCreateSchema = z.object(staffFields);

export const staffUpdateSchema = z
  .object(staffFields)
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  });

export const staffStatusSchema = z.object({ status: staffStatus });

/** Class settings: every field optional; subjectIds, when sent, replaces the class's linked subjects. */
export const classUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "Class name must be at least 2 characters.").max(120),
    description: z.preprocess(blankToNull, z.string().trim().max(1000).nullish()),
    academicYear: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"]),
    groupName: z.string().trim().min(1, "Group is required.").max(80),
    section: z.preprocess(blankToNull, z.string().trim().max(40).nullish()),
    subjectIds: z
      .array(z.string().min(1))
      .min(1, "Please select at least one subject.")
      .transform((ids) => [...new Set(ids)]),
  })
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  });

export const staffListQuerySchema = z.object({
  q: z.string().trim().max(100, "Search must be at most 100 characters.").optional(),
  category: staffCategory.optional(),
  status: staffStatus.optional(),
});

export const generateQuestionsSchema = z.object({
  classId: z.string().min(1),
  count: z.number().int().min(1).max(100).default(5),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  topicName: z.string().optional(),
});
