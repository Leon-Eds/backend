import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../config/db";
import { createRateLimiter } from "../middlewares/security.middleware";

/** Runs the limiter middleware once and reports whether the request was let through. */
async function runLimiter(limiter: ReturnType<typeof createRateLimiter>, ip = "1.2.3.4") {
  let status = 200;
  let passed = false;
  const res: any = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) { this.headers[name] = value; },
    status(code: number) { status = code; return this; },
    json() { return this; },
  };
  await limiter({ ip } as any, res, () => { passed = true; });
  return { passed, status, remaining: res.headers["RateLimit-Remaining"] };
}

test("rate limiter uses the shared database count and blocks past the limit", async () => {
  const original = (prisma as any).$queryRaw;
  let count = 0;
  (prisma as any).$queryRaw = async () => [{ count: ++count, resetAt: new Date(Date.now() + 60000) }];
  try {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2, keyPrefix: "test-shared" });
    assert.deepEqual(await runLimiter(limiter), { passed: true, status: 200, remaining: "1" });
    assert.deepEqual(await runLimiter(limiter), { passed: true, status: 200, remaining: "0" });
    assert.deepEqual(await runLimiter(limiter), { passed: false, status: 429, remaining: "0" });
  } finally {
    (prisma as any).$queryRaw = original;
  }
});

test("rate limiter still limits with an in-memory count when the database is unreachable", async () => {
  const originalQuery = (prisma as any).$queryRaw;
  const originalError = console.error;
  (prisma as any).$queryRaw = async () => { throw new Error("database unreachable"); };
  console.error = () => {};
  try {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1, keyPrefix: "test-fallback" });
    assert.equal((await runLimiter(limiter, "5.6.7.8")).passed, true);
    assert.equal((await runLimiter(limiter, "5.6.7.8")).status, 429);
  } finally {
    (prisma as any).$queryRaw = originalQuery;
    console.error = originalError;
  }
});
