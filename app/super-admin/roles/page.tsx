import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";

const ROLES = ["Super Admin", "Institution Admin", "Teacher", "Student"];
const PERMS = ["View", "Create", "Edit", "Delete", "Publish", "Manage Users", "Manage Exams", "View Analytics", "Download Reports"];

export default function RolesPage() {
  return (
    <div>
      <PageHeader title="Roles & permissions" subtitle="Control what each role can do across the platform." />
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2">Permission</th>
              {ROLES.map((role) => (
                <th key={role} className="py-2 text-center">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMS.map((perm) => (
              <tr key={perm} className="border-t border-white/8">
                <td className="py-2">{perm}</td>
                {ROLES.map((role) => (
                  <td key={role} className="py-2 text-center">
                    <input type="checkbox" defaultChecked={!(role === "Student" && perm !== "View")} readOnly />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
