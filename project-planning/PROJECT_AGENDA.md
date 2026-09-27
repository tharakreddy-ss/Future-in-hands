# Future in Hands: Project Agenda

**Purpose:** Make the existing assessment platform safe and dependable for a small institution pilot, then improve the learning and administration workflows using evidence from that pilot.

**Current progress (26 September 2026):** The local PostgreSQL-backed app is running. The existing visual system is preserved while route motion, reduced-motion behavior, a data-driven Super Admin exam workspace, role-scoped global search, and clearer teacher empty states are in place. The answer-save path now checks attempt ownership and assigned-paper membership, grading leaves already-submitted attempts unchanged, production auth requires a strong shared secret, and invalid/unconfigured AI generation no longer inserts generic placeholder questions. The full tenant/API audit, upload protection, concurrency review, teacher review workflow, and pilot documentation remain open below.

## Phase 1 — Protect the exam and institution boundaries

**Priority:** Start here. These issues can expose student data, permit unauthorized answer writes, or compromise exam integrity.

- Trace every API handler into its service and require role, institution ownership, and resource membership checks on each read and write.
- Bind answer saves to the authenticated student, their active attempt, and a question on that attempt's assigned paper.
- Make grading and submission idempotent; lock answers after submission and close attempts consistently when time expires.
- Remove the default session secret. Validate required environment variables at startup and use the same signing/verification configuration in middleware and server code.
- Add file upload limits, content validation, non-public storage, and a clear access/retention policy for syllabus documents.

**Exit criteria:** Cross-institution access is denied; students cannot alter another student's attempt or submit off-paper questions; submitted attempts cannot be changed; production cannot start with the development secret; uploads cannot be read publicly by guessing a URL.

## Phase 2 — Make the pilot exam journey complete

- Verify the full admin/teacher journey: create class, enroll students, add syllabus, build/review question bank, schedule/publish exam, and see assignment status.
- Verify the full student journey: sign in, see eligible exams, start once, resume safely, autosave answers, submit on time, and view results when released.
- Confirm exam-window/timezone behavior, shuffled papers, reconnect behavior, and notification timing.
- Define what students see before and after results are released and what teachers can review.
- Improve setup documentation and provide a repeatable local seed/demo institution.

**Exit criteria:** A pilot operator can run a complete exam without manual database edits; students can recover from refresh/network interruption; results and assignment statuses agree; release instructions work from a clean checkout.

## Phase 3 — Make AI question authoring trustworthy

- Decide supported subjects, curricula, languages, question formats, and who approves AI drafts.
- Remove silent, unrelated placeholder MCQs. If the provider is unavailable or output fails validation, return a clear error or an explicitly labeled draft fallback that cannot be published without teacher review.
- Validate model responses with Zod or equivalent runtime schemas, check count and answer-key consistency, and retain provenance (provider/model, source syllabus, review state).
- Add a teacher review/edit/approve workflow and show syllabus/topic coverage before questions are added to a live exam.
- Replace substring duplicate checks with a documented similarity approach and a teacher-visible duplicate warning.
- Track AI usage and failures at institution level without storing unnecessary student data.

**Exit criteria:** Every AI item is schema-valid, tied to a source/topic, reviewable by a teacher, and cannot be mistaken for verified syllabus-aligned content before approval.

## Phase 4 — Pilot, observe, and prepare to scale

- Run a controlled pilot with one or more institutions and collect teacher/student feedback on setup time, test completion, answer recovery, result clarity, and question quality.
- Add dashboards around the actual pilot questions: completion, question-level performance, topic coverage, and operational failures.
- Add automated checks for permissions/tenant isolation, attempts/grading, exam windows, question generation, and uploads.
- Establish deployment health checks, database backup/restore practice, monitoring/alerts, and incident ownership.
- Review subscription and notification flows against confirmed operating requirements before enabling paid or external-message workflows.

**Exit criteria:** Pilot results lead to a prioritized product backlog; operators can detect and recover from common failures; data restore and release procedures are documented and exercised.

## First two weeks: recommended sequence

1. **Days 1–2:** Map API authorization and resource ownership. Fix answer ownership/question membership and session-secret configuration.
2. **Days 3–4:** Fix attempt lifecycle and grading idempotency. Review exam close/time limit behavior.
3. **Days 5–6:** Lock down uploads and inspect institution isolation on every route.
4. **Days 7–8:** Walk through teacher/admin and student flows against a seeded demo institution; write down broken or ambiguous steps.
5. **Days 9–10:** Replace unsafe AI fallbacks and establish teacher review; update setup documentation and agree on the pilot checklist.

## Decisions the project owner should settle before implementation expands

- Which country/state curricula, grade levels, subjects, and languages are in the first pilot?
- Are AI-generated questions drafts only, or can a teacher-approved item be reused across exams?
- What is the policy for negative marking, partial credit, exam retakes, result release, and accommodations?
- Which roles may create students, schedule exams, view answer keys, export reports, and manage institutions?
- What document types and maximum sizes should syllabus uploads support, and how long should files and attempt data be retained?
- Which notifications are required for the pilot, and which channels are in scope?

## Working rhythm

- Maintain one prioritized backlog with an owner and acceptance criteria for each item.
- Review security and assessment correctness before visual polish or additional AI features.
- At the end of each phase, demonstrate the flow using seeded users and record unresolved risks.
- Treat generated question quality and student data handling as release criteria, not later enhancements.
