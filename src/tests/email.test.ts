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
