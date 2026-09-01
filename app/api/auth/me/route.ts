import { getSession } from "@/lib/auth";
import { json } from "@/lib/utils";

export async function GET() {
  return json({ user: await getSession() });
}
