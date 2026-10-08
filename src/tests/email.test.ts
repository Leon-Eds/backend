import test from "node:test";
import assert from "node:assert/strict";
import { emailService } from "../utils/email";
import { emailTemplates } from "../utils/email-templates";

test("password reset email uses the configured frontend URL", () => {
  const { html } = emailTemplates.getPasswordReset(
    "Test User",
    "fixture-token",
    "https://www.leoned.ng/"
  );

  assert.match(html, /https:\/\/www\.leoned\.ng\/reset-password\?token=fixture-token/);
  assert.doesNotMatch(html, /https:\/\/leoned\.app\/reset-password/);
});

test("teacher and student welcome emails use the active frontend login and omit the apple emoji", () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  try {
    process.env.FRONTEND_URL = "https://www.leoned.ng/";

    const teacher = emailTemplates.getTeacherWelcome(
      "Test Teacher",
      "Test School",
      "teacher@example.test",
      "temporary-password"
    );
    const student = emailTemplates.getStudentWelcome(
      "parent@example.test",
      "Test Parent",
      "Test Student",
      "Test School",
      "student@example.test",
      "ADM-001",
      "temporary-password"
    );

    for (const email of [teacher, student]) {
      assert.match(email.html, /href="https:\/\/www\.leoned\.ng\/login"/);
      assert.doesNotMatch(email.html, /https:\/\/leoned\.app\/login/);
    }
    assert.doesNotMatch(teacher.html, /🍎/);
  } finally {
    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
  }
});

test("email delivery fails explicitly when unconfigured and uses Resend when configured", async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFromEmail = process.env.FROM_EMAIL;
  const originalFetch = globalThis.fetch;

  try {
    delete process.env.RESEND_API_KEY;
    delete process.env.FROM_EMAIL;

    await assert.rejects(
      emailService.sendVerificationOtpEmail("nobody@example.invalid", "Test", "000000"),
      /RESEND_API_KEY is not configured/
    );

    process.env.RESEND_API_KEY = "re_test_fixture";
    process.env.FROM_EMAIL = "LeonEd Africa <noreply@example.test>";
    globalThis.fetch = async () => new Response(
      JSON.stringify({ id: "email_fixture" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

    const result = await emailService.sendVerificationOtpEmail(
      "nobody@example.invalid",
      "Test",
      "000000"
    );

    assert.equal(result.success, true);
    assert.equal(result.data?.id, "email_fixture");
    assert.equal("simulated" in result, false);
  } finally {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;

    if (originalFromEmail === undefined) delete process.env.FROM_EMAIL;
    else process.env.FROM_EMAIL = originalFromEmail;

    globalThis.fetch = originalFetch;
  }
});
