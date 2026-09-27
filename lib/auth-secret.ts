const DEVELOPMENT_SECRET = "dev-examly-secret-change-in-production";

export function getAuthSecret() {
  const configured = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!configured || configured.length < 32)) {
    throw new Error("AUTH_SECRET must be set to a value of at least 32 characters in production.");
  }
  return new TextEncoder().encode(configured || DEVELOPMENT_SECRET);
}
