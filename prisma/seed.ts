import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { Prisma, PrismaClient, type Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const db = new PrismaClient();

const SLUG = "demo-academy";

function hashText(text: string) {
  return createHash("sha256")
    .update(text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
    .digest("hex");
}

function keys(correct: string, w1: string, w2: string, w3: string) {
  return [
    { key: "A", text: correct },
    { key: "B", text: w1 },
    { key: "C", text: w2 },
    { key: "D", text: w3 },
  ];
}

type BankItem = {
  text: string;
  topic: string;
  difficulty: Difficulty;
  options: ReturnType<typeof keys>;
};

function bank(): BankItem[] {
  const items: Array<[string, string, string, string, string, string, Difficulty]> = [
    ["Right to Equality is covered by which articles?", "Articles 14-18", "Articles 19-22", "Articles 23-24", "Articles 25-28", "Fundamental Rights", "EASY"],
    ["Article 14 of the Constitution guarantees:", "Equality before law", "Freedom of speech", "Freedom of religion", "Right to property", "Fundamental Rights", "EASY"],
    ["Which article abolishes untouchability?", "Article 17", "Article 15", "Article 16", "Article 18", "Fundamental Rights", "EASY"],
    ["Right to constitutional remedies is:", "Article 32", "Article 21", "Article 19", "Article 226", "Fundamental Rights", "MEDIUM"],
    ["Dr. Ambedkar called Article 32:", "The heart and soul of the Constitution", "The brain of the Constitution", "A directive principle", "A conventional right", "Fundamental Rights", "MEDIUM"],
    ["Article 19 originally had how many freedoms?", "Seven", "Six", "Five", "Eight", "Fundamental Rights", "MEDIUM"],
    ["Right to property is now a:", "Legal right under Article 300A", "Fundamental right", "Directive principle", "Fundamental duty", "Fundamental Rights", "HARD"],
    ["Article 21 protects:", "Life and personal liberty", "Freedom of assembly", "Freedom of trade", "Cultural rights", "Fundamental Rights", "EASY"],
    ["Which writ is issued to produce a detained person?", "Habeas corpus", "Mandamus", "Certiorari", "Quo warranto", "Fundamental Rights", "MEDIUM"],
    ["Article 15 prohibits discrimination on grounds of:", "Religion, race, caste, sex or place of birth", "Income only", "Language only", "Age only", "Fundamental Rights", "EASY"],
    ["Cultural and educational rights are in:", "Articles 29-30", "Articles 25-28", "Articles 14-18", "Articles 32-35", "Fundamental Rights", "MEDIUM"],
    ["Preventive detention is dealt with in:", "Article 22", "Article 20", "Article 21A", "Article 23", "Fundamental Rights", "HARD"],
    ["The Parliament of India consists of:", "President, Lok Sabha and Rajya Sabha", "Lok Sabha only", "Rajya Sabha only", "Prime Minister and Cabinet", "Parliament", "EASY"],
    ["Maximum strength of Lok Sabha is:", "550", "250", "545", "500", "Parliament", "MEDIUM"],
    ["Rajya Sabha is a:", "Permanent house", "Dissolved every 5 years", "Nominated house only", "State legislature", "Parliament", "EASY"],
    ["Money bills can be introduced only in:", "Lok Sabha", "Rajya Sabha", "Either house", "Joint sitting", "Parliament", "MEDIUM"],
    ["The Speaker of Lok Sabha is elected by:", "Members of Lok Sabha", "President", "Prime Minister", "Rajya Sabha", "Parliament", "EASY"],
    ["Joint sitting of Parliament is summoned by:", "The President", "The Speaker", "The Vice-President", "The Prime Minister", "Parliament", "MEDIUM"],
    ["Vice-President is the ex-officio Chairman of:", "Rajya Sabha", "Lok Sabha", "NITI Aayog", "Supreme Court", "Parliament", "EASY"],
    ["A money bill after Rajya Sabha recommendations must return within:", "14 days", "30 days", "7 days", "60 days", "Parliament", "HARD"],
    ["The concept of parliamentary privileges is in:", "Articles 105 and 194", "Article 74", "Article 78", "Article 123", "Parliament", "HARD"],
    ["Zero Hour in Parliament starts at:", "12 noon", "11 am", "2 pm", "10 am", "Parliament", "MEDIUM"],
    ["Who decides if a bill is a money bill?", "Speaker of Lok Sabha", "President", "Finance Minister", "Chairman of Rajya Sabha", "Parliament", "MEDIUM"],
    ["The Council of Ministers is collectively responsible to:", "Lok Sabha", "Rajya Sabha", "President", "Supreme Court", "Parliament", "EASY"],
    ["Ordinance making power of the President is:", "Article 123", "Article 72", "Article 356", "Article 111", "Parliament", "HARD"],
    ["Directive Principles are contained in:", "Part IV", "Part III", "Part IV-A", "Part V", "Directive Principles", "EASY"],
    ["Directive Principles are:", "Non-justiciable", "Justiciable like FRs", "Ordinary laws", "Fundamental duties", "Directive Principles", "EASY"],
    ["Article 40 deals with:", "Organisation of village panchayats", "Uniform civil code", "Equal pay", "Free legal aid", "Directive Principles", "MEDIUM"],
    ["Uniform civil code is mentioned in:", "Article 44", "Article 45", "Article 39", "Article 48", "Directive Principles", "MEDIUM"],
    ["Article 45 originally directed the state to provide:", "Free and compulsory education for children", "Living wage", "Nutrition", "Forest protection", "Directive Principles", "MEDIUM"],
    ["The idea of DPSPs was borrowed from:", "Ireland", "USA", "UK", "Canada", "Directive Principles", "EASY"],
    ["Article 39(b) and 39(c) relate to:", "Distribution of material resources and prevention of concentration of wealth", "Freedom of trade", "Religious instruction", "Emergency provisions", "Directive Principles", "HARD"],
    ["Gandhian principles among DPSPs include:", "Promotion of cottage industries", "Separation of judiciary", "International peace", "Equal justice", "Directive Principles", "MEDIUM"],
    ["Article 48A was added by:", "42nd Amendment", "44th Amendment", "1st Amendment", "73rd Amendment", "Directive Principles", "HARD"],
    ["Equal pay for equal work is:", "Article 39(d)", "Article 41", "Article 43", "Article 47", "Directive Principles", "MEDIUM"],
    ["Article 51 promotes:", "International peace and security", "Agriculture", "Co-operatives", "Monuments", "Directive Principles", "EASY"],
    ["Fundamental Duties were added by:", "42nd Amendment", "44th Amendment", "24th Amendment", "52nd Amendment", "Directive Principles", "MEDIUM"],
    ["Which DPSP aims at a living wage for workers?", "Article 43", "Article 41", "Article 47", "Article 46", "Directive Principles", "HARD"],
    ["Separation of judiciary from executive is:", "Article 50", "Article 49", "Article 38", "Article 37", "Directive Principles", "HARD"],
    ["Article 21A (Right to Education) was inserted by:", "86th Amendment", "42nd Amendment", "44th Amendment", "73rd Amendment", "Fundamental Rights", "HARD"],
    ["Who can amend the Constitution?", "Parliament", "President alone", "Supreme Court", "Election Commission", "Parliament", "EASY"],
    ["Basic structure doctrine was laid down in:", "Kesavananda Bharati case", "Golaknath case", "Minerva Mills", "Maneka Gandhi", "Fundamental Rights", "HARD"],
    ["The Preamble describes India as a:", "Sovereign Socialist Secular Democratic Republic", "Federal monarchy", "Presidential republic only", "Confederation", "Parliament", "EASY"],
    ["Which schedule deals with anti-defection?", "Tenth Schedule", "Ninth Schedule", "Eighth Schedule", "Seventh Schedule", "Parliament", "MEDIUM"],
    ["The Attorney General of India is appointed by:", "The President", "The Prime Minister", "The Chief Justice", "The Solicitor General", "Parliament", "MEDIUM"],
    ["Article 368 deals with:", "Amendment of the Constitution", "Finance Commission", "Election Commission", "Emergency", "Parliament", "MEDIUM"],
    ["Which article deals with the Finance Commission?", "Article 280", "Article 266", "Article 312", "Article 324", "Parliament", "HARD"],
    ["The minimum age for Rajya Sabha membership is:", "30 years", "25 years", "35 years", "21 years", "Parliament", "EASY"],
    ["The minimum age for Lok Sabha membership is:", "25 years", "30 years", "21 years", "35 years", "Parliament", "EASY"],
    ["Which article provides for a National Commission for SCs?", "Article 338", "Article 330", "Article 335", "Article 340", "Fundamental Rights", "HARD"],
  ];

  return items.map(([text, correct, w1, w2, w3, topic, difficulty]) => ({
    text,
    topic,
    difficulty,
    options: keys(correct, w1, w2, w3),
  }));
}

async function upsertUser(data: {
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "INSTITUTION_ADMIN" | "TEACHER" | "STUDENT";
  passwordHash: string;
  institutionId?: string;
}) {
  return db.user.upsert({
    where: { email: data.email.toLowerCase() },
    update: {
      name: data.name,
      role: data.role,
      passwordHash: data.passwordHash,
      isActive: true,
      institutionId: data.institutionId,
    },
    create: {
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      passwordHash: data.passwordHash,
      institutionId: data.institutionId,
    },
  });
}

async function main() {
  const superHash = await bcrypt.hash("SuperAdmin@123", 12);
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const studentHash = await bcrypt.hash("Student@123", 12);
  const teacherHash = await bcrypt.hash("Teacher@123", 12);

  await upsertUser({
    email: "superadmin@mocktestai.com",
    name: "Platform Super Admin",
    role: "SUPER_ADMIN",
    passwordHash: superHash,
  });

  const institution = await db.institution.upsert({
    where: { slug: SLUG },
    update: {
      name: "Demo Academy",
      email: "admin@demoacademy.com",
      status: "ACTIVE",
      subscriptionPlan: "GROWTH",
      subscriptionStatus: "ACTIVE",
      studentIdPrefix: "STU",
    },
    create: {
      name: "Demo Academy",
      slug: SLUG,
      email: "admin@demoacademy.com",
      status: "ACTIVE",
      subscriptionPlan: "GROWTH",
      subscriptionStatus: "ACTIVE",
      studentIdPrefix: "STU",
    },
  });

  const admin = await upsertUser({
    email: "admin@demoacademy.com",
    name: "Demo Institution Admin",
    role: "INSTITUTION_ADMIN",
    passwordHash: adminHash,
    institutionId: institution.id,
  });

  await upsertUser({
    email: "teacher@demoacademy.com",
    name: "Anita Sharma",
    role: "TEACHER",
    passwordHash: teacherHash,
    institutionId: institution.id,
  });

  let classroom = await db.class.findFirst({
    where: { institutionId: institution.id, name: "UPSC Batch 2026" },
  });
  if (!classroom) {
    classroom = await db.class.create({
      data: {
        institutionId: institution.id,
        name: "UPSC Batch 2026",
        subject: "Indian Polity",
        description: "Demo classroom for Indian Polity mock tests.",
        createdById: admin.id,
      },
    });
  } else {
    classroom = await db.class.update({
      where: { id: classroom.id },
      data: { subject: "Indian Polity", createdById: admin.id },
    });
  }

  const studentSpecs = [
    { id: "STU001", first: "Ravi", last: "Kumar", email: "ravi.kumar@demoacademy.com" },
    { id: "STU002", first: "Suresh", last: "Kumar", email: "suresh.kumar@demoacademy.com" },
    { id: "STU003", first: "Priya", last: "Sharma", email: "priya.sharma@demoacademy.com" },
    { id: "STU004", first: "Anjali", last: "Reddy", email: "anjali.reddy@demoacademy.com" },
    { id: "STU005", first: "Kiran", last: "Kumar", email: "kiran.kumar@demoacademy.com" },
  ];

  const students = [];
  for (const spec of studentSpecs) {
    const user = await upsertUser({
      email: spec.email,
      name: `${spec.first} ${spec.last}`,
      role: "STUDENT",
      passwordHash: studentHash,
      institutionId: institution.id,
    });
    const student = await db.student.upsert({
      where: { studentIdentifier: spec.id },
      update: {
        firstName: spec.first,
        lastName: spec.last,
        email: spec.email,
        status: "ACTIVE",
        institutionId: institution.id,
        userId: user.id,
      },
      create: {
        userId: user.id,
        institutionId: institution.id,
        studentIdentifier: spec.id,
        firstName: spec.first,
        lastName: spec.last,
        email: spec.email,
        status: "ACTIVE",
      },
    });
    await db.classStudent.upsert({
      where: { classId_studentId: { classId: classroom.id, studentId: student.id } },
      update: {},
      create: { classId: classroom.id, studentId: student.id },
    });
    students.push(student);
  }

  const syllabusContent = `Fundamental Rights in Indian Constitution
Parliament of India
Directive Principles of State Policy`;

  let syllabus = await db.syllabus.findFirst({
    where: { classId: classroom.id, title: "Indian Polity Core" },
  });
  if (!syllabus) {
    syllabus = await db.syllabus.create({
      data: {
        institutionId: institution.id,
        classId: classroom.id,
        title: "Indian Polity Core",
        inputType: "TEXT",
        content: syllabusContent,
        createdById: admin.id,
        analyzedJson: {
          summary: "Core UPSC Indian Polity coverage for mock tests.",
          topics: [
            { name: "Fundamental Rights", weightage: 40, subtopics: [] },
            { name: "Parliament", weightage: 30, subtopics: [] },
            { name: "Directive Principles", weightage: 30, subtopics: [] },
          ],
        },
      },
    });
  }

  const topicNames = [
    { name: "Fundamental Rights", weightage: 40 },
    { name: "Parliament", weightage: 30 },
    { name: "Directive Principles", weightage: 30 },
  ];
  const topics = [];
  for (const topic of topicNames) {
    const existing = await db.syllabusTopic.findFirst({
      where: { syllabusId: syllabus.id, name: topic.name },
    });
    topics.push(
      existing ??
        (await db.syllabusTopic.create({
          data: { syllabusId: syllabus.id, name: topic.name, weightage: topic.weightage },
        })),
    );
  }

  const questions: Array<{ id: string }> = [];
  for (const [index, item] of bank().entries()) {
    const topic = topics.find((row) => row.name === item.topic) ?? topics[0];
    const questionHash = hashText(item.text);
    const saved = await db.question.upsert({
      where: { institutionId_questionHash: { institutionId: institution.id, questionHash } },
      update: {
        questionText: item.text,
        optionsJson: item.options as unknown as Prisma.InputJsonValue,
        correctAnswer: "A",
        explanation: `Correct answer: ${item.options[0].text}`,
        difficulty: item.difficulty,
        classId: classroom.id,
        syllabusId: syllabus.id,
        topicId: topic.id,
        source: index < 30 ? "AI" : "MANUAL",
        usageCount: 2,
        syllabusReference: item.topic,
        subtopic: item.topic,
      },
      create: {
        institutionId: institution.id,
        classId: classroom.id,
        syllabusId: syllabus.id,
        topicId: topic.id,
        questionText: item.text,
        optionsJson: item.options as unknown as Prisma.InputJsonValue,
        correctAnswer: "A",
        explanation: `Correct answer: ${item.options[0].text}`,
        difficulty: item.difficulty,
        questionHash,
        source: index < 30 ? "AI" : "MANUAL",
        usageCount: 2,
        syllabusReference: item.topic,
        subtopic: item.topic,
      },
    });
    questions.push(saved);
  }

  const existingUsage = await db.aiUsage.findFirst({ where: { institutionId: institution.id } });
  if (!existingUsage) {
    await db.aiUsage.create({
      data: {
        institutionId: institution.id,
        kind: "QUESTION_GENERATION",
        questionsGenerated: 30,
      },
    });
  }

  async function upsertTest(title: string, startAt: Date, endAt: Date, examStatus: "LIVE" | "SCHEDULED") {
    let test = await db.test.findFirst({ where: { classId: classroom!.id, title } });
    if (test) return test;
    const schedule = {
      durationMinutes: 60,
      totalQuestions: 50,
      status: "PUBLISHED" as const,
      examStatus,
      examDate: startAt,
      startAt,
      endAt,
      publishedAt: new Date(),
    };
    if (!test) {
      test = await db.test.create({
        data: {
          institutionId: institution.id,
          classId: classroom!.id,
          syllabusId: syllabus!.id,
          title,
          createdById: admin.id,
          variationCount: 3,
          ...schedule,
          distributionJson: {
            easyPercent: 30,
            mediumPercent: 50,
            hardPercent: 20,
            topicPercents: [
              { topic: "Fundamental Rights", percent: 40 },
              { topic: "Parliament", percent: 30 },
              { topic: "Directive Principles", percent: 30 },
            ],
          },
        },
      });
    } else {
      test = await db.test.update({
        where: { id: test.id },
        data: schedule,
      });
    }

    await db.testQuestion.deleteMany({ where: { testId: test.id } });
    await db.testQuestion.createMany({
      data: questions.map((question, order) => ({
        testId: test.id,
        questionId: question.id,
        questionOrder: order,
        optionOrderJson: ["A", "B", "C", "D"] as unknown as Prisma.InputJsonValue,
      })),
    });
    return test;
  }

  const now = new Date();
  const liveStart = new Date(now.getTime() - 60 * 60 * 1000);
  const liveEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  upcomingStart.setHours(10, 0, 0, 0);
  const upcomingEnd = new Date(upcomingStart.getTime() + 60 * 60 * 1000);

  const test1 = await upsertTest("Indian Polity Mock Test 1", liveStart, liveEnd, "LIVE");
  const test2 = await upsertTest("Indian Polity Mock Test 2", upcomingStart, upcomingEnd, "SCHEDULED");

  async function seedPapers(testId: string) {
    const existingPapers = await db.paperVariation.findMany({ where: { testId }, orderBy: { sortOrder: "asc" } });
    if (existingPapers.length) return existingPapers;
    const questionIds = questions.map((question) => question.id);
    const papers = [];
    for (let i = 0; i < 3; i += 1) {
      papers.push(
        await db.paperVariation.create({
          data: {
            testId,
            label: `Paper ${String.fromCharCode(65 + i)}`,
            sortOrder: i,
            questionIdsJson: [...questionIds].sort(() => Math.random() - 0.5),
          },
        }),
      );
    }
    return papers;
  }

  const papers1 = await seedPapers(test1.id);
  const papers2 = await seedPapers(test2.id);

  for (const [index, student] of students.entries()) {
    const paper = papers1[index % papers1.length]!;
    await db.testAssignment.upsert({
      where: { testId_studentId: { testId: test1.id, studentId: student.id } },
      update: {},
      create: {
        testId: test1.id,
        studentId: student.id,
        status: "COMPLETED",
        paperVariationId: paper.id,
        questionOrderJson: questions.map((q) => q.id),
        optionOrderJson: {},
      },
    });
  }

  for (const [index, student] of students.entries()) {
    const paper = papers2[index % papers2.length]!;
    await db.testAssignment.upsert({
      where: { testId_studentId: { testId: test2.id, studentId: student.id } },
      update: {},
      create: {
        testId: test2.id,
        studentId: student.id,
        status: "ASSIGNED",
        paperVariationId: paper.id,
        questionOrderJson: questions.map((q) => q.id),
        optionOrderJson: {},
      },
    });
  }

  const practice = await upsertTest("Live Practice — Indian Polity", liveStart, liveEnd, "LIVE");
  const practicePapers = await seedPapers(practice.id);
  for (const [index, student] of students.entries()) {
    const order = questions.map((q) => q.id).sort(() => Math.random() - 0.5);
    const options = Object.fromEntries(order.map((id) => [id, ["A", "B", "C", "D"].sort(() => Math.random() - 0.5)]));
    await db.testAssignment.upsert({ where: { testId_studentId: { testId: practice.id, studentId: student.id } }, update: {}, create: { testId: practice.id, studentId: student.id, paperVariationId: practicePapers[index % practicePapers.length].id, questionOrderJson: order, optionOrderJson: options } });
  }

  const scores: Record<string, [number, number]> = {
    STU001: [42, 38],
    STU002: [35, 40],
    STU003: [45, 44],
    STU004: [30, 36],
    STU005: [40, 42],
  };

  async function seedAttempt(studentId: string, testId: string, correctCount: number) {
    const existing = await db.studentTestAttempt.findUnique({
      where: { studentId_testId: { studentId, testId } },
    });
    if (existing) return;

    const assignment = await db.testAssignment.findUnique({
      where: { testId_studentId: { testId, studentId } },
    });

    const attempt = await db.studentTestAttempt.create({
      data: {
        studentId,
        testId,
        assignmentId: assignment?.id,
        status: "SUBMITTED",
        startedAt: new Date(Date.now() - 1000 * 60 * 70),
        submittedAt: new Date(Date.now() - 1000 * 60 * 10),
        totalQuestions: 50,
        correctAnswers: correctCount,
        wrongAnswers: 50 - correctCount,
        unansweredQuestions: 0,
        score: correctCount,
        percentage: (correctCount / 50) * 100,
        timeTakenSeconds: 48 * 60,
        remainingSeconds: 0,
        currentQuestionIndex: 49,
      },
    });

    await db.studentAnswer.createMany({
      data: questions.map((question, index) => ({
        attemptId: attempt.id,
        questionId: question.id,
        selectedAnswer: index < correctCount ? "A" : "B",
        isCorrect: index < correctCount,
        timeSpentSeconds: 50,
      })),
    });
  }

  for (const student of students) {
    const pair = scores[student.studentIdentifier];
    if (!pair) continue;
    await seedAttempt(student.id, test1.id, pair[0]);

  }

  for (const student of students) {
    await db.notification.upsert({
      where: {
        studentId_testId_type: {
          studentId: student.id,
          testId: test2.id,
          type: "EXAM_SCHEDULED",
        },
      },
      update: {
        title: "New exam scheduled",
        body: `Indian Polity Mock Test 2 starts on ${upcomingStart.toLocaleString()}.`,
        readAt: null,
      },
      create: {
        institutionId: institution.id,
        studentId: student.id,
        testId: test2.id,
        type: "EXAM_SCHEDULED",
        title: "New exam scheduled",
        body: `Indian Polity Mock Test 2 starts on ${upcomingStart.toLocaleString()}.`,
      },
    });
  }

  console.log("Demo seed complete (idempotent).");
  console.log("  Super Admin         superadmin@mocktestai.com / SuperAdmin@123");
  console.log("  Institution Admin   admin@demoacademy.com / Admin@123");
  console.log("  Teacher             teacher@demoacademy.com / Teacher@123");
  console.log("  Student             STU001 / Student@123");
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
