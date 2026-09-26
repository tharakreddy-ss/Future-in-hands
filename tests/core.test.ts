import test from "node:test";
import assert from "node:assert/strict";
import { attemptRemaining } from "../lib/attempt-deadline";
import { examWindow, validateSchedule } from "../lib/exam-window";
import { isDuplicateStem } from "../lib/ai/duplicate-detector";
import { validUploadSignature } from "../lib/upload-validation";
test("refresh uses elapsed wall-clock time and the shorter exam window", () => {
  const startedAt = new Date("2026-01-01T00:00:00Z");
  const now = startedAt.getTime() + 120000;
  assert.equal(attemptRemaining({ startedAt, test: { durationMinutes: 5 } }, now), 180);
  assert.equal(attemptRemaining({ startedAt, test: { durationMinutes: 5, endAt: new Date(now + 10000) } }, now), 10);
  assert.equal(attemptRemaining({ startedAt, test: { durationMinutes: 1 } }, now), 0);
});
test("access is locked before start and closed at the exact deadline", () => {
  const startAt = new Date("2026-01-01T00:00:00Z"); const endAt = new Date(startAt.getTime() + 300000);
  assert.equal(examWindow({ status: "PUBLISHED", startAt, endAt, now: new Date(startAt.getTime() - 1) }), "LOCKED");
  assert.equal(examWindow({ status: "PUBLISHED", startAt, endAt, now: startAt }), "LIVE");
  assert.equal(examWindow({ status: "PUBLISHED", startAt, endAt, now: endAt }), "CLOSED");
  assert.throws(() => validateSchedule(endAt, startAt, 5));
  assert.throws(() => validateSchedule(startAt, endAt, 10));
});
test("duplicates support Unicode without rejecting every non-English stem", () => {
  assert.equal(isDuplicateStem("What is gravity?", ["WHAT is gravity!"]), true);
  assert.equal(isDuplicateStem("What is gravity?", ["What is gravity on the surface of the Moon?"]), false);
  assert.equal(isDuplicateStem("భారత రాజధాని ఏది?", ["తెలంగాణ రాజధాని ఏది?"]), false);
});
test("upload MIME labels must match file signatures", () => {
  assert.equal(validUploadSignature(Buffer.from("%PDF-1.7"), "application/pdf"), true);
  assert.equal(validUploadSignature(Buffer.from("<script>bad</script>"), "application/pdf"), false);
  assert.equal(validUploadSignature(Buffer.from("89504e470d0a1a0a", "hex"), "image/png"), true);
});
