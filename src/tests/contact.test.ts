import test from "node:test";
import assert from "node:assert/strict";
import { ContactService } from "../services/contact.service";
import { emailTemplates } from "../utils/email-templates";
import { emailService } from "../utils/email";

test("contact email escapes public input", () => {
  const { subject, html } = emailTemplates.getContactQuery({
    name: "<script>alert('name')</script>",
    email: "person@example.com",
    schoolName: "Demo School\r\nBcc: attacker@example.com",
    message: "Hello <img src=x onerror=alert(1)>",
  });

  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(subject, /[\r\n]/);
});

test("contact service delivers genuine queries and silently accepts honeypot submissions", async () => {
  const originalContactEmail = process.env.CONTACT_EMAIL;
  const originalSendContactQueryEmail = emailService.sendContactQueryEmail;
  const deliveries: Array<{ to: string; email: string }> = [];

  try {
    process.env.CONTACT_EMAIL = "support@example.com";
    emailService.sendContactQueryEmail = async (to, query) => {
      deliveries.push({ to, email: query.email });
      return { success: true, data: { id: "email-id" } } as any;
    };

    const genuineQuery = {
      name: "Ada User",
      email: "ada@example.com",
      phone: "",
      schoolName: "Ada Academy",
      message: "Please arrange a product demonstration.",
      website: "",
    };
    await ContactService.submit(genuineQuery);
    await ContactService.submit({ ...genuineQuery, website: "https://spam.example" });

    assert.deepEqual(deliveries, [{ to: "support@example.com", email: "ada@example.com" }]);
  } finally {
    if (originalContactEmail === undefined) delete process.env.CONTACT_EMAIL;
    else process.env.CONTACT_EMAIL = originalContactEmail;
    emailService.sendContactQueryEmail = originalSendContactQueryEmail;
  }
});
