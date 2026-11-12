import test from "node:test";
import assert from "node:assert/strict";
import { StudentService } from "../services/student.service";

const SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

/**
 * In-memory stand-in for the Prisma parent delegate, passed to findOrCreateParent
 * as its client so no database is needed.
 */
function fakeClient(existing: any[] = []) {
  const parents = [...existing];
  const calls: { findUnique: any[]; findFirst: any[]; create: any[]; update: any[] } = {
    findUnique: [], findFirst: [], create: [], update: [],
  };
  const client = {
    parent: {
      findUnique: async (args: any) => {
        calls.findUnique.push(args);
        const { schoolId, email } = args.where.schoolId_email;
        return parents.find((p) => p.schoolId === schoolId && p.email === email) || null;
      },
      findFirst: async (args: any) => {
        calls.findFirst.push(args);
        const { schoolId, email, phone } = args.where;
        return parents.find((p) => p.schoolId === schoolId && p.email === email && p.phone === phone) || null;
      },
      create: async (args: any) => {
        calls.create.push(args);
        const parent = { id: `parent-${parents.length + 1}`, ...args.data };
        parents.push(parent);
        return parent;
      },
      update: async (args: any) => {
        calls.update.push(args);
        const parent = parents.find((p) => p.id === args.where.id);
        Object.assign(parent, args.data);
        return parent;
      },
    },
  };
  return { client, calls };
}

const findOrCreateParent = (data: any, client: any) =>
  (StudentService as any).findOrCreateParent(SCHOOL_ID, data, client);

test("creates a parent from name and phone when no email is given", async () => {
  const { client, calls } = fakeClient();
  const parent = await findOrCreateParent(
    { parentName: " Mrs Obi ", parentEmail: "", parentPhone: "08030000000", parentRelationship: "Mother", parentAddress: "12 School Rd" },
    client
  );

  assert.equal(calls.create.length, 1);
  assert.equal(parent.email, null);
  assert.equal(parent.fullName, "Mrs Obi");
  assert.equal(parent.phone, "08030000000");
  assert.equal(parent.relationship, "Mother");
  assert.equal(parent.address, "12 School Rd");
});

test("reuses an email-less parent with the same phone instead of duplicating", async () => {
  const existing = { id: "parent-1", schoolId: SCHOOL_ID, fullName: "Mrs Obi", email: null, phone: "08030000000", relationship: "", address: "" };
  const { client, calls } = fakeClient([existing]);
  const parent = await findOrCreateParent(
    { parentName: "Mrs Obi", parentEmail: "", parentPhone: "08030000000", parentRelationship: "Mother" },
    client
  );

  assert.equal(parent.id, "parent-1");
  assert.equal(calls.create.length, 0);
  assert.equal(parent.relationship, "Mother");
});

test("matches by email (case-insensitive) when an email is given", async () => {
  const existing = { id: "parent-1", schoolId: SCHOOL_ID, fullName: "Mr Ade", email: "ade@example.test", phone: "", relationship: "", address: "" };
  const { client, calls } = fakeClient([existing]);
  const parent = await findOrCreateParent({ parentName: "Mr Ade", parentEmail: " ADE@example.test " }, client);

  assert.equal(parent.id, "parent-1");
  assert.equal(calls.create.length, 0);
  assert.equal(calls.findFirst.length, 0);
});

test("returns null only when name, email and phone are all blank", async () => {
  const { client, calls } = fakeClient();
  const parent = await findOrCreateParent({ parentName: "  ", parentEmail: "", parentPhone: "" }, client);

  assert.equal(parent, null);
  assert.equal(calls.create.length, 0);
});
