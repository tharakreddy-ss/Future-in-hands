import { createHash } from "crypto";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;

/** Per-account failures before that login is locked for the rest of the window. */
const ACCOUNT_LIMIT = 5;
/** Per-IP failures; high because a whole school can share one NAT address. */
const IP_LIMIT = 50;

export type ThrottleKey = { key: string; limit: number };

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Accounts are keyed by the submitted login, so unknown and real accounts are throttled identically. */
export function loginThrottleKeys(login: string, ip: string | null): ThrottleKey[] {
  const keys: ThrottleKey[] = [{ key: digest(`account:${login.trim().toLowerCase()}`), limit: ACCOUNT_LIMIT }];
  if (ip) keys.push({ key: digest(`ip:${ip}`), limit: IP_LIMIT });
  return keys;
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || null;
}

/** Seconds until the caller may try again, or 0 when no key is over its limit. */
export async function loginRetryAfter(keys: ThrottleKey[]) {
  const now = Date.now();
  const rows = await db.loginThrottle.findMany({
    where: { key: { in: keys.map((item) => item.key) }, windowStart: { gte: new Date(now - WINDOW_MS) } },
  });
  let retryAfter = 0;
  for (const row of rows) {
    const limit = keys.find((item) => item.key === row.key)?.limit ?? ACCOUNT_LIMIT;
    if (row.failures >= limit) {
      retryAfter = Math.max(retryAfter, Math.ceil((row.windowStart.getTime() + WINDOW_MS - now) / 1000));
    }
  }
  return retryAfter;
}

export async function recordLoginFailure(keys: ThrottleKey[]) {
  const now = new Date();
  const windowOpenedAfter = new Date(now.getTime() - WINDOW_MS);
  for (const { key } of keys) {
    await db.$executeRaw`
      INSERT INTO "login_throttles" ("key", "failures", "window_start", "updated_at")
      VALUES (${key}, 1, ${now}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "failures" = CASE WHEN "login_throttles"."window_start" < ${windowOpenedAfter} THEN 1 ELSE "login_throttles"."failures" + 1 END,
        "window_start" = CASE WHEN "login_throttles"."window_start" < ${windowOpenedAfter} THEN ${now} ELSE "login_throttles"."window_start" END,
        "updated_at" = ${now}`;
  }
  await db.loginThrottle.deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - STALE_MS) } } });
}

/** Only the account key is cleared; the IP counter keeps protecting other accounts on that address. */
export async function clearAccountFailures(keys: ThrottleKey[]) {
  await db.loginThrottle.deleteMany({ where: { key: keys[0].key } });
}
