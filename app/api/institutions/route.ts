import { withAuth } from "@/lib/with-auth";
import { institutionService } from "@/services/institution.service";
import { json } from "@/lib/utils";
import { institutionSchema } from "@/lib/validators";

export function GET() {
  return withAuth(async () => json(await institutionService.list()), ["SUPER_ADMIN"]);
}

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = institutionSchema.parse(await request.json());
    return json(await institutionService.create(body), 201);
  }, ["SUPER_ADMIN"]);
}
