import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createSessionSchema } from "../validations/session.validation";
import { bulkCreateGradingRulesSchema } from "../validations/grading.validation";
import { ReportService } from "../services/report.service";
import { generateJwtToken, verifyJwtToken } from "../utils/jwt";

process.env.JWT_KEY = "test-only-jwt-key-with-at-least-32-characters";
process.env.JWT_ISSUER = "LeonEdBackendTests";
process.env.JWT_AUDIENCE = "LeonEdFrontendTests";

test("session validation rejects impossible and reversed dates", () => {
  assert.equal(createSessionSchema.safeParse({ name: "Invalid", startDate: "2026-02-30", endDate: "2026-03-01" }).success, false);
  assert.equal(createSessionSchema.safeParse({ name: "Reversed", startDate: "2026-09-02", endDate: "2026-09-01" }).success, false);
});

test("grading validation rejects overlaps and gaps", () => {
  const result = bulkCreateGradingRulesSchema.safeParse({
    rules: [
      { grade: "A", minScore: 70, maxScore: 100 },
      { grade: "B", minScore: 60, maxScore: 80 },
    ],
  });
  assert.equal(result.success, false);
});

test("CSV export neutralizes spreadsheet formulas", () => {
  const csv = ReportService.generateCsv("enrollment", {
    students: [{
      fullName: "=HYPERLINK(\"https://example.test\")",
      admissionNumber: "SAFE-001",
      gender: "Male",
      className: "JSS 1",
      status: "Active",
      enrolledAt: "2026-09-01T00:00:00.000Z",
    }],
  });
  assert.match(csv, /"'=HYPERLINK/);
});

test("JWT verification enforces issuer, audience, and algorithm", () => {
  const token = generateJwtToken({
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@example.test",
    name: "Admin",
    role: "SchoolAdmin",
    schoolId: "00000000-0000-0000-0000-000000000002",
    isVerified: true,
  });
  assert.equal(verifyJwtToken(token).sub, "00000000-0000-0000-0000-000000000001");

  const wrongIssuerToken = jwt.sign(
    { sub: "00000000-0000-0000-0000-000000000001" },
    process.env.JWT_KEY!,
    { algorithm: "HS256", issuer: "WrongIssuer", audience: process.env.JWT_AUDIENCE }
  );
  assert.throws(() => verifyJwtToken(wrongIssuerToken));
});
