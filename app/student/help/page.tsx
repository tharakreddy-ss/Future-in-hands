import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";

export default function StudentHelpPage() {
  return (
    <div>
      <PageHeader title="Help & Support" subtitle="Getting started, exams, and results." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {["Getting Started", "Creating Exams", "AI Question Generation", "Student Management", "Reports"].map((item) => (
          <Card key={item}>{item}</Card>
        ))}
      </div>
    </div>
  );
}
