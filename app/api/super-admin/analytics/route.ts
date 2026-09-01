import { withAuth } from "@/lib/with-auth";
import { analyticsService } from "@/services/analytics.service";
import { json } from "@/lib/utils";

export function GET() {
  return withAuth(async () => json(await analyticsService.platform()), ["SUPER_ADMIN"]);
}
