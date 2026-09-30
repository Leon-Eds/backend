import test from "node:test";
import assert from "node:assert/strict";
import { getAllowedOrigins, resolveFrontendUrl } from "../utils/frontend-url";

test("uses an allowed request origin for password reset links", () => {
  const originalCorsOrigins = process.env.CORS_ORIGINS;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  try {
    process.env.CORS_ORIGINS = [
      "http://localhost:3000/",
      "https://frontend-alpha-five-39.vercel.app/",
      "https://www.leoned.ng/",
      "https://leoned.ng/",
    ].join(",");
    process.env.FRONTEND_URL = "https://www.leoned.ng/";

    assert.deepEqual(getAllowedOrigins(), [
      "http://localhost:3000",
      "https://frontend-alpha-five-39.vercel.app",
      "https://www.leoned.ng",
      "https://leoned.ng",
    ]);
    assert.equal(resolveFrontendUrl("http://localhost:3000"), "http://localhost:3000");
    assert.equal(
      resolveFrontendUrl("https://frontend-alpha-five-39.vercel.app"),
      "https://frontend-alpha-five-39.vercel.app"
    );
    assert.equal(resolveFrontendUrl("https://leoned.ng"), "https://leoned.ng");
  } finally {
    if (originalCorsOrigins === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = originalCorsOrigins;

    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
  }
});

test("falls back to FRONTEND_URL instead of trusting an unknown origin", () => {
  const originalCorsOrigins = process.env.CORS_ORIGINS;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  try {
    process.env.CORS_ORIGINS = "https://www.leoned.ng";
    process.env.FRONTEND_URL = "https://www.leoned.ng";

    assert.equal(resolveFrontendUrl("https://attacker.example"), "https://www.leoned.ng");
    assert.equal(resolveFrontendUrl(), "https://www.leoned.ng");
  } finally {
    if (originalCorsOrigins === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = originalCorsOrigins;

    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
  }
});
