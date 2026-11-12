import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../config/db";
import { FeeStructureService } from "../services/fee-structure.service";

const SCHOOL_ID = "00000000-0000-0000-0000-000000000001";
const TERM_ID = "00000000-0000-0000-0000-0000000000f1";

const structures = [
  { id: "base-junior", type: "base", amount: 50000, applicableLevels: ["JSS 1", "JSS 2"] },
  { id: "base-all", type: "base", amount: 2000, applicableLevels: ["All"] },
  { id: "bus", type: "custom", amount: 15000, applicableLevels: [] },
];

/**
 * Stub the Prisma delegates the fee structure service reads, and restore them afterwards.
 */
async function withFeeStubs(
  options: { assignments?: any[]; students?: any[]; payments?: any[] },
  run: () => Promise<void>
) {
  const originals = {
    feeStructureFindMany: (prisma.feeStructure as any).findMany,
    studentCustomFeeFindMany: (prisma.studentCustomFee as any).findMany,
    termFindFirst: (prisma.term as any).findFirst,
    studentFindMany: (prisma.student as any).findMany,
    feePaymentFindMany: (prisma.feePayment as any).findMany,
  };
  try {
    (prisma.feeStructure as any).findMany = async () => structures;
    (prisma.studentCustomFee as any).findMany = async () => options.assignments || [];
    (prisma.term as any).findFirst = async () => ({ id: TERM_ID, termNumber: "First", academicSession: { name: "2026/2027" } });
    (prisma.student as any).findMany = async () => options.students || [];
    (prisma.feePayment as any).findMany = async () => options.payments || [];
    await run();
  } finally {
    (prisma.feeStructure as any).findMany = originals.feeStructureFindMany;
    (prisma.studentCustomFee as any).findMany = originals.studentCustomFeeFindMany;
    (prisma.term as any).findFirst = originals.termFindFirst;
    (prisma.student as any).findMany = originals.studentFindMany;
    (prisma.feePayment as any).findMany = originals.feePaymentFindMany;
  }
}

test("expected fees add base fees for the class level, 'All' fees and assigned custom fees", async () => {
  await withFeeStubs({ assignments: [{ studentId: "ada", feeStructureId: "bus" }] }, async () => {
    const expected = await FeeStructureService.computeExpectedAmounts(SCHOOL_ID, [
      { id: "ada", className: "jss1" }, // matched ignoring case and spaces
      { id: "bayo", className: "SS 1" },
      { id: "chidi", className: null },
    ]);

    assert.equal(expected.get("ada"), 50000 + 2000 + 15000);
    assert.equal(expected.get("bayo"), 2000);
    assert.equal(expected.get("chidi"), 2000);
  });
});

test("term summary uses recorded amounts due, falling back to fee structures", async () => {
  await withFeeStubs(
    {
      students: [
        { id: "ada", class: { name: "JSS 1" } },   // recorded: due 60000, paid 60000
        { id: "bayo", class: { name: "JSS 2" } },  // recorded: due 52000, paid 20000
        { id: "chidi", class: { name: "JSS 1" } }, // nothing recorded: 52000 from structures
      ],
      payments: [
        { studentId: "ada", amountDue: 60000, amountPaid: 60000, status: "Cleared" },
        { studentId: "bayo", amountDue: 52000, amountPaid: 20000, status: "Pending" },
      ],
    },
    async () => {
      const result: any = await FeeStructureService.getTermSummary(SCHOOL_ID, TERM_ID);

      assert.equal(result.success, true);
      assert.equal(result.data.totalExpected, 60000 + 52000 + 52000);
      assert.equal(result.data.totalCollected, 80000);
      assert.equal(result.data.totalOutstanding, 32000 + 52000);
      assert.equal(result.data.clearedCount, 1);
      assert.equal(result.data.collectionRate, 48.8);
    }
  );
});
