# Future in Hands: Codebase Analysis

**Reviewed:** 25 September 2026  
**Repository:** `Future-in-hands` (`main`, clean at review time)

## Product shape

Future in Hands is a multi-institution online assessment platform. It has separate experiences for institution administrators, teachers, students, and a platform super-admin. The core workflow already represented in code is:

1. Set up an institution, classes, and student accounts.
2. Add or analyze a syllabus and build a reusable question bank.
3. Generate and schedule tests, assign paper variations to enrolled students, and notify them.
4. Let a student take a timed test, save answers, submit, and review results and analytics.
5. Give institution and platform administrators reporting and subscription views.

## Current architecture

- **Web application:** Next.js App Router 16.3.3, React 19, TypeScript, Tailwind CSS 4.
- **Persistence:** PostgreSQL through Prisma 6.19.3. The schema includes institutions, users, students, classes/enrollments, syllabuses/topics, questions, tests/paper variations/assignments, attempts/answers, notifications, and AI usage.
- **Application layers:** route handlers in `app/api`, business workflows in `services`, data access in `repositories`, shared authentication/tenant/AI helpers in `lib`.
- **AI:** OpenAI Chat Completions integration with a heuristic fallback; syllabus parsing and MCQ generation live under `lib/ai`.
- **Visible product areas:** public marketing/pricing, staff and student authentication, teacher/admin exam tools, student test-taking/results, super-admin operations and analytics.

## What is already implemented

- Role-based sign-in and route gating for super-admin, institution admin, teacher, and student.
- Institution and class relationships, student enrollment, syllabus/topic storage, and question-bank records.
- Scheduled exam windows, paper variation and shuffled question/option ordering.
- Student attempts, answer autosave endpoints, server-side grading, result records, and in-app notification records.
- Prisma migrations and a seed script; Docker Compose provides a local PostgreSQL service.
- AI syllabus analysis, question generation, draft validation, duplicate-stem detection, and usage accounting.

## Risks to resolve before real student use

### P0: exam integrity and access control

- **Addressed in the current working tree:** `answerService.save` receives the authenticated student ID, verifies attempt and assignment ownership, checks that the question belongs to the assigned paper and test, validates the answer option and question position, and returns no correctness signal while the exam is in progress. Keep this check at the service boundary.
- Several API routes pass caller-supplied IDs to services without consistently applying `requireTenant` or verifying that the referenced class, test, syllabus, student, or attempt belongs to the caller's institution. Audit every read and write path before onboarding multiple institutions.
- **Partially addressed in the current working tree:** grading now returns an already-submitted attempt without changing its timestamp or score. Add concurrency-safe submission and verify every automatic close path before pilot use.
- **Addressed in the current working tree:** `lib/auth-secret.ts` is shared by server auth and middleware; production refuses a missing or short `AUTH_SECRET`. The development fallback remains for local use.
- Continue auditing every API/service pair for tenant and resource ownership. In particular, inspect test/result/notification/settings and upload endpoints; fixing answer ownership alone does not establish tenant isolation across the product.

### P1: assessment content quality

- **Addressed in the current working tree:** question generation fails with a clear service error when no AI provider is configured; the unrelated hard-coded Indian Constitution fallback is removed. AI output now passes a Zod structure check and the existing draft validation, and partial/invalid counts are rejected. Teacher approval, syllabus relevance review, provenance, and draft state are still open.
- The current duplicate detector uses substring matching, which can reject unrelated short stems and miss paraphrases. Define a reviewable duplicate policy and cover it with representative cases.
- `analyzeSyllabus` uses a line-based fallback. It should make the heuristic nature visible and require teacher review before derived topics/questions are used in an exam.

### P1: upload and student data protection

- `app/api/uploads/route.ts` checks MIME type but has no visible maximum file size or content/signature validation, writes to `public/uploads`, and returns a public URL. Add size limits, safe generated names, private or access-controlled storage, retention rules, and extraction failure handling before uploading real syllabuses or student documents.
- Define data access, deletion, and retention expectations for student profiles, answers, and reports. Ensure logs and analytics do not expose answer keys or student data unnecessarily.

### P2: reliability and release readiness

- The app has no test script and the repository scan found no test/spec suite. Add coverage for tenant isolation, roles, exam windows, answer persistence, grading, AI output validation, and upload limits before releases.
- The README is still the default create-next-app guide. Replace it with product setup, required environment variables, migration/seed steps, role flows, deployment steps, and operating guidance.
- Review transaction boundaries, concurrency, notification delivery guarantees, and error handling around scheduled exams and attempts. `examService.syncWindows` currently performs per-test and per-attempt writes inline during reads, which may become costly as usage grows.
- Add production health checks, structured operational logs, backup/restore instructions, and deployment environment validation.

## Constraints and unknowns

- No product requirements, target curriculum, launch date, institution pilot, grading policy, or pricing assumptions were present in the repository. The agenda below therefore prioritizes the product flows that are already in code and marks those decisions for confirmation by the project owner.
- The current database and AI provider configuration are environment-driven. This review did not connect to a database, call the AI provider, run builds, or inspect production infrastructure.
- The top-level README does not describe the product; the code and Prisma schema are the stronger evidence of current scope.
