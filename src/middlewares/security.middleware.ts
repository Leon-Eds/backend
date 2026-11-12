import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";

type RateEntry = { count: number; resetAt: number };
// Used only if the shared database store is unreachable
const entries = new Map<string, RateEntry>();

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Counts a request against `key` and returns the count in the current window.
 * The count lives in the database so every serverless instance sees the same number;
 * one atomic statement increments it or starts a new window when the old one has ended.
 */
export async function hitRateLimit(key: string, windowMs: number): Promise<RateEntry> {
  const now = new Date();
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${new Date(now.getTime() + windowMs)})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN EXCLUDED."resetAt" ELSE "RateLimitBucket"."resetAt" END
      RETURNING "count", "resetAt"`;

    // Now and then, clear out buckets that expired more than a day ago
    if (Math.random() < 0.01) {
      prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date(now.getTime() - DAY_MS) } } }).catch(() => {});
    }
    return { count: Number(rows[0].count), resetAt: new Date(rows[0].resetAt).getTime() };
  } catch (err) {
    console.error("[RateLimit] Shared store unavailable, using this instance's count:", err);
    const stored = entries.get(key);
    const entry = !stored || stored.resetAt <= now.getTime() ? { count: 0, resetAt: now.getTime() + windowMs } : stored;
    entry.count += 1;
    entries.set(key, entry);
    return { ...entry };
  }
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

export function createRateLimiter(options: { windowMs: number; max: number; keyPrefix: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const entry = await hitRateLimit(`${options.keyPrefix}:${req.ip}`, options.windowMs);
    res.setHeader("RateLimit-Limit", String(options.max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, options.max - entry.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > options.max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    }
    next();
  };
}
