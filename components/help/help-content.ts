export type HelpCategory =
  | "Exams"
  | "Results"
  | "Classes"
  | "Notifications"
  | "Profile"
  | "Account"
  | "Technical Issues";

export type FaqItem = {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "start-test",
    category: "Exams",
    question: "How do I start a test?",
    answer:
      "Open Exams from the student menu (or go to /student/tests). Choose a test that is assigned to you and whose window is live. Use Start exam. Locked tests cannot be started until the scheduled start time. Closed tests cannot be started. If you already began an attempt, use Continue exam.",
  },
  {
    id: "timer-ends",
    category: "Exams",
    question: "What happens when the exam timer ends?",
    answer:
      "The exam uses a countdown based on the remaining time for your attempt (the shorter of the test duration and the scheduled end time). If the page is open when the timer reaches zero, the exam is submitted automatically using answers that have already been saved. If you are away when time runs out, the next time the attempt is loaded the system submits saved answers. Unsaved answers that never reached the server may be lost.",
  },
  {
    id: "change-answer",
    category: "Exams",
    question: "Can I change my answer before submitting?",
    answer:
      "Yes. You can move between questions with Previous, Next, or the question list and select a different option. Each selection is saved to the server. After you submit, you cannot change answers.",
  },
  {
    id: "leave-exam",
    category: "Exams",
    question: "What happens if I leave the exam page?",
    answer:
      "Leaving the page does not immediately submit the exam. Your attempt stays in progress until you submit or time runs out. Saved answers remain on the server. Unsaved answers are kept in this browser only until they finish saving. You can return from Exams with Continue exam. The student menu is hidden during an attempt so you stay focused on the test.",
  },
  {
    id: "results-calc",
    category: "Results",
    question: "How are my results calculated?",
    answer:
      "After submission, each question is marked from your saved selection. Your score is the number of correct answers. Percentage is that score divided by the number of questions on your paper. The result also stores how many answers were correct, wrong, or unanswered. There is no extra marks field beyond one mark per question.",
  },
  {
    id: "see-answers",
    category: "Results",
    question: "When can I see my correct and wrong answers?",
    answer:
      "Correct answers and explanations are shown only on a submitted result review. They are not shown during a live exam. Open Results, then open the submitted exam to see each question, your answer, the correct option, and a stored explanation when one exists.",
  },
  {
    id: "previous-results",
    category: "Results",
    question: "Where can I see my previous results?",
    answer:
      "Open Results in the student menu (/student/results). Only your submitted exams are listed. Open a row to review that attempt. You can also open a result from Analytics or from a completed exam on a class page.",
  },
  {
    id: "where-classes",
    category: "Classes",
    question: "Where can I see my classes?",
    answer:
      "Open Classes (/student/classes). You only see classrooms you are enrolled in. Open a class for details, assigned exams, and any syllabus or materials linked to that class.",
  },
  {
    id: "study-materials",
    category: "Classes",
    question: "Where can I find study materials?",
    answer:
      "Open a class, then use Learning materials and Syllabus / topics. Files appear only if your institution linked a subject library PDF to that class. Class syllabus titles and topic names appear when staff have added them. If nothing is listed, materials have not been added for that class yet.",
  },
  {
    id: "read-notifications",
    category: "Notifications",
    question: "How do I read notifications?",
    answer:
      "Open Notifications (/student/notifications), or use the bell in the header. You only see your own notices (scheduled exams, reminders, live exams, and results). Unread items are highlighted. You can mark one as read or mark all as read. Some notices include a link to the exam, result, or class.",
  },
  {
    id: "update-profile",
    category: "Profile",
    question: "How do I update my profile?",
    answer:
      "Open Profile. You can edit personal details such as name, phone, gender, date of birth, address, and guardian information, and you can upload a profile photo. Student ID, email, role, institution, and class enrollment cannot be changed from Profile.",
  },
  {
    id: "change-password",
    category: "Account",
    question: "How do I change my password?",
    answer:
      "Open Profile and use Change password. Enter your current password, then a new password of at least 6 characters, and confirm it. Passwords are stored hashed. There is no in-app password reset email; if you cannot sign in, contact your institution administrator.",
  },
  {
    id: "technical-problem",
    category: "Technical Issues",
    question: "What should I do if I face a technical problem?",
    answer:
      "Check your internet connection and try again. On an exam, use Retry save if an answer did not save. Refresh or reopen Exams if a page fails to load. If a result is missing, confirm the exam was submitted. If the problem continues, contact your institution administrator. This app does not include a built-in help desk or support inbox.",
  },
];

export const GUIDES: Array<{ title: string; steps: string[] }> = [
  {
    title: "Taking an exam",
    steps: [
      "Open Exams (/student/tests).",
      "Open an assigned test that is live (not locked or closed).",
      "Select Start exam (or Continue exam if you already started).",
      "Answer questions. Selections save automatically when the network is available.",
      "Use Previous, Next, or the question list to move around.",
      "Submit exam before the timer ends, or the exam is submitted when time is up.",
    ],
  },
  {
    title: "Viewing results",
    steps: [
      "Open Results (/student/results).",
      "Select a submitted exam.",
      "Review the score summary, exam times, and topic breakdown when topics exist.",
      "Scroll to question review for your answers, the correct options, and stored explanations.",
    ],
  },
  {
    title: "Using classes",
    steps: [
      "Open Classes (/student/classes).",
      "Select a class you are enrolled in.",
      "Review upcoming and completed exams, then start or view a result when the buttons allow it.",
      "Open learning materials or syllabus topics if your institution has added them.",
    ],
  },
  {
    title: "Notifications",
    steps: [
      "Open Notifications, or select the bell in the header.",
      "Read the title, message, type, and date.",
      "Follow a student exam, result, or class link when one is shown.",
      "Mark a notice as read, or use Mark all as read.",
    ],
  },
  {
    title: "Managing your profile",
    steps: [
      "Open Profile.",
      "Review personal, academic, and account information.",
      "Edit allowed personal fields and save.",
      "Upload a photo if you want one (JPG, PNG, or WebP, up to 5 MB).",
      "Use Change password for a new password.",
    ],
  },
];

export const TROUBLESHOOTING: Array<{ title: string; steps: string[] }> = [
  {
    title: "Test page is not loading",
    steps: [
      "Refresh the page and sign in again if needed.",
      "Confirm you are opening Exams as a student, not a staff workspace.",
      "Check that the test is assigned to you and the exam window is live.",
    ],
  },
  {
    title: "Submit button is not responding",
    steps: [
      "Wait for “All answers saved”. Manual submit is blocked while answers are still saving.",
      "Use Retry save, then submit again.",
      "If the timer already ended, wait a moment or reopen the attempt; saved answers may already have been submitted.",
    ],
  },
  {
    title: "Internet connection drops",
    steps: [
      "Reconnect, then use Retry save so queued answers can upload.",
      "Do not assume an unsaved choice is stored until the page says answers are saved.",
      "If time expired while you were offline, reopen the exam or Results to see whether it was submitted.",
    ],
  },
  {
    title: "Results are not visible yet",
    steps: [
      "Results list only submitted exams.",
      "If you just submitted, open Results and refresh.",
      "You cannot open another student’s result by changing the address in the browser.",
    ],
  },
  {
    title: "Notification is not updating",
    steps: [
      "Open the Notifications page and refresh.",
      "The header bell refreshes periodically and after you mark items as read.",
      "You only receive notices for your own assigned exams and results.",
    ],
  },
  {
    title: "Profile update fails",
    steps: [
      "Fill in first name (required) and keep other fields within the length limits.",
      "You cannot change Student ID, email, class, or role from Profile.",
      "If saving still fails, try again later or ask your institution administrator.",
    ],
  },
  {
    title: "Password change fails",
    steps: [
      "Enter the current password correctly.",
      "Use a new password of at least 6 characters and type the same value in Confirm.",
      "If you no longer know the current password, contact your institution administrator. This app does not email a reset link.",
    ],
  },
];

export const QUICK_LINKS = [
  { href: "/student/tests", label: "Exams" },
  { href: "/student/results", label: "Results" },
  { href: "/student/classes", label: "Classes" },
  { href: "/student/analytics", label: "Analytics" },
  { href: "/student/notifications", label: "Notifications" },
  { href: "/student/profile", label: "Profile" },
] as const;
