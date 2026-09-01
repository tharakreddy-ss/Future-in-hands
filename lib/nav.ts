import type { Role } from "@prisma/client";

export type NavKey =
  | "dashboard"
  | "classes"
  | "subjects"
  | "exams"
  | "questions"
  | "students"
  | "teachers"
  | "generate"
  | "analytics"
  | "reports"
  | "settings"
  | "institutions"
  | "users"
  | "roles"
  | "profile"
  | "notifications"
  | "help";

export type NavItem = { href: string; label: string; icon: NavKey };

export function navForRole(role: Role): NavItem[] {
  if (role === "SUPER_ADMIN") {
    return [
      { href: "/super-admin/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/super-admin/institutions", label: "Institutions", icon: "institutions" },
      { href: "/super-admin/users", label: "Users", icon: "users" },
      { href: "/super-admin/roles", label: "Roles", icon: "roles" },
      { href: "/super-admin/exams", label: "Exams", icon: "exams" },
      { href: "/super-admin/analytics", label: "Analytics", icon: "analytics" },
      { href: "/super-admin/reports", label: "Reports", icon: "reports" },
      { href: "/super-admin/settings", label: "Settings", icon: "settings" },
    ];
  }
  if (role === "INSTITUTION_ADMIN") {
    return [
      { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/classes", label: "Classes", icon: "classes" },
      { href: "/admin/subjects", label: "Subjects", icon: "subjects" },
      { href: "/admin/exams", label: "Exams", icon: "exams" },
      { href: "/admin/questions", label: "Question Bank", icon: "questions" },
      { href: "/admin/students", label: "Students", icon: "students" },
      { href: "/admin/teachers", label: "Teachers", icon: "teachers" },
      { href: "/admin/generate", label: "AI Generate", icon: "generate" },
      { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
      { href: "/admin/reports", label: "Reports", icon: "reports" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
    ];
  }
  if (role === "TEACHER") {
    return [
      { href: "/teacher/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/teacher/classes", label: "Classes", icon: "classes" },
      { href: "/teacher/exams", label: "Exams", icon: "exams" },
      { href: "/teacher/questions", label: "Question Bank", icon: "questions" },
      { href: "/teacher/generate", label: "AI Generate", icon: "generate" },
      { href: "/teacher/analytics", label: "Analytics", icon: "analytics" },
      { href: "/teacher/students", label: "Students", icon: "students" },
      { href: "/teacher/settings", label: "Settings", icon: "settings" },
    ];
  }
  return [
    { href: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/student/classes", label: "Classes", icon: "classes" },
    { href: "/student/tests", label: "Exams", icon: "exams" },
    { href: "/student/results", label: "Results", icon: "reports" },
    { href: "/student/analytics", label: "Analytics", icon: "analytics" },
    { href: "/student/notifications", label: "Notifications", icon: "notifications" },
    { href: "/student/profile", label: "Profile", icon: "profile" },
    { href: "/student/help", label: "Help", icon: "help" },
  ];
}

export function createActionFor(role: Role) {
  if (role === "SUPER_ADMIN") return { href: "/super-admin/institutions", label: "Add Institution" };
  if (role === "STUDENT") return { href: "/student/tests", label: "Start Mock Test" };
  if (role === "TEACHER") return { href: "/teacher/generate", label: "Create Exam" };
  return { href: "/admin/generate", label: "Create Exam" };
}
