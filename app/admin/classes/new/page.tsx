import { ResourceForm } from "@/components/management/resource-form";
export default function NewClassPage() {
 return <ResourceForm title="Create a classroom" endpoint="/api/classes" successPath="/admin/classes/:id/overview" fields={[{ name: "name", label: "Class name" }, { name: "subject", label: "Subject" }, { name: "description", label: "Description", optional: true }]} />;
}
