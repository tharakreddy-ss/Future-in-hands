export type StudentClassRef = {
  id: string;
  name: string;
  section: string;
  academicYear: string;
};

export type StudentHit = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  studentIdentifier: string;
  status: "ACTIVE" | "INACTIVE";
  className: string;
  section: string;
  classId: string | null;
  rollNumber: string | null;
  photoUrl: string | null;
  academicYear: string | null;
  classes: StudentClassRef[];
};

export type StudentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  studentIdentifier: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
  joinDate: string;
  institution: string;
  className: string;
  section: string;
  academicYear: string | null;
  rollNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  address: string | null;
  classSubjects: string[];
  classId: string | null;
  metrics: {
    attempted: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    rank: { position: number; of: number } | null;
  };
  series: Array<{
    examName: string;
    subject: string;
    date: string;
    score: number;
    total: number;
    percentage: number;
  }>;
  subjects: Array<{ name: string; average: number; status: string }>;
  history: Array<{
    id: string;
    examName: string;
    subject: string;
    date: string;
    score: number;
    total: number;
    percentage: number;
    status: string;
  }>;
  insights: { summary: string; strengths: string[]; weak: string[] };
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
