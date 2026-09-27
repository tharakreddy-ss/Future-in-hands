import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main() {
  const { db } = await import("../lib/db");
  const { examService } = await import("../services/exam.service");
  const { notificationService } = await import("../services/notification.service");
  let stopping = false;
  process.on("SIGINT", () => { stopping = true; });
  process.on("SIGTERM", () => { stopping = true; });
  do {
    try {
      await examService.syncWindows();
      const students = await db.student.findMany({ where: { status: "ACTIVE", institution: { status: "ACTIVE" } }, select: { id: true } });
      for (const student of students) await notificationService.dispatchDue(student.id);
    } catch (error) { console.error("Exam worker cycle failed", error instanceof Error ? error.message : "Unknown error"); }
    if (process.argv.includes("--once")) break;
    if (!stopping) await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (!stopping);
  await db.$disconnect();
}
main().catch(() => { process.exitCode = 1; });
