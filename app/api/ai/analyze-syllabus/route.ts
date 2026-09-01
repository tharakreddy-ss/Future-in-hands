import { withAuth } from "@/lib/with-auth";
import { analyzeSyllabus } from "@/lib/ai/syllabus-analyzer";
import { json } from "@/lib/utils";
import { z } from "zod";

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = z.object({ rawText: z.string().min(8) }).parse(await request.json());
    return json(await analyzeSyllabus(body.rawText));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
