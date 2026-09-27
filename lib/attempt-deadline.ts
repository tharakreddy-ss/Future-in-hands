export function attemptDeadline(attempt: { startedAt: Date | string; test: { durationMinutes: number; endAt?: Date | string | null } }) {
  const durationEnd = new Date(attempt.startedAt).getTime() + attempt.test.durationMinutes * 60_000;
  return Math.min(durationEnd, attempt.test.endAt ? new Date(attempt.test.endAt).getTime() : Infinity);
}
export function attemptRemaining(attempt: Parameters<typeof attemptDeadline>[0], now = Date.now()) {
  return Math.max(0, Math.ceil((attemptDeadline(attempt) - now) / 1000));
}
