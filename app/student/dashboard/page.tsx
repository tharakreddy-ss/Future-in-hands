import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { studentDashboardService } from "@/services/student-dashboard.service";
import { PageFade } from "@/components/motion/page-fade";
import { DashboardSection, Panel, PanelEmpty } from "@/components/student-dashboard/section";
import { UpcomingExamCarousel } from "@/components/student-dashboard/upcoming-exam-carousel";
import { ScheduleSection } from "@/components/student-dashboard/schedule-section";
import { LearningSection } from "@/components/student-dashboard/learning-section";
import { RecentResults } from "@/components/student-dashboard/recent-results";
import { StudentPanel } from "@/components/student-dashboard/student-panel";

export default async function StudentDashboardPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const data = await studentDashboardService.load(user.studentId);
  if (!data.profile) notFound();
  const { summary, profile } = data;
  const lastSevenDays = data.schedule.filter((day) => day.isPast || day.isToday).slice(-7);

  return (
    <PageFade>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_21.5rem]">
        <div className="min-w-0 space-y-12">
          <DashboardSection id="upcoming-exams" title="Upcoming Exams" href="/student/tests" linkLabel="All exams">
            {data.exams.length ? (
              <UpcomingExamCarousel exams={data.exams} />
            ) : (
              <Panel>
                <PanelEmpty
                  icon={<CalendarClock className="h-5 w-5" />}
                  title="No upcoming exams"
                  description="When your institution schedules an exam for you, it will appear here until it closes."
                  action={
                    <Link href="/student/practice" className="text-xs font-semibold text-violet-300 hover:text-white">
                      Practice while you wait →
                    </Link>
                  }
                />
              </Panel>
            )}
          </DashboardSection>

          <DashboardSection id="schedule" title="Your Schedule" description="Learning activity this past week and exams coming up">
            <ScheduleSection days={data.schedule} activeDays={data.progress.activeDaysThisWeek} />
          </DashboardSection>

          <DashboardSection id="learning" title="Your Learning">
            <LearningSection
              progress={data.progress}
              activity={data.activity}
              currentStreak={summary.currentStreak}
              streakHoursLeft={summary.streakHoursLeft}
              generatedAt={data.generatedAt}
            />
          </DashboardSection>

          <DashboardSection id="recent-results" title="Recent Results" href="/student/results" linkLabel="All results">
            <RecentResults results={data.stats.recentResults} />
          </DashboardSection>
        </div>

        <aside className="min-w-0 xl:border-l xl:border-white/[0.06] xl:pl-8" aria-label="Your profile and progress">
          <StudentPanel
            name={`${profile.firstName} ${profile.lastName}`.trim()}
            photoUrl={profile.photoKey ? "/api/student/profile/photo" : null}
            todayLabel={data.todayLabel}
            summary={summary}
            goals={data.goals}
            lastSevenDays={lastSevenDays}
            stats={{ attempted: data.stats.attempted, averageScore: data.stats.averageScore }}
            practiceAccuracy={data.progress.practiceAccuracyThisWeek}
          />
        </aside>
      </div>
    </PageFade>
  );
}
