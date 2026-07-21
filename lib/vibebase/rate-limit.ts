import { createHash } from "node:crypto";
import { VibebaseError } from "@/lib/vibebase/errors";

type RateWindow = { count: number; resetAt: number };

const windows = new Map<string, RateWindow>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function assertRequestRateLimit(authorization: string | null, forwardedFor: string | null) {
  const identity = authorization ? createHash("sha256").update(authorization).digest("hex") : forwardedFor?.split(",")[0]?.trim() || "anonymous";
  const now = Date.now();
  const window = windows.get(identity);
  if (!window || window.resetAt <= now) {
    windows.set(identity, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (window.count >= MAX_REQUESTS) {
    throw new VibebaseError("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
  }
  window.count += 1;
}

export function resetRateLimits() {
  windows.clear();
}
