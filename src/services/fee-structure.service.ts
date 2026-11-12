import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";

type FeeStructureType = "base" | "custom";

/** Class names are compared ignoring case and spaces, so "JSS 1" matches "jss1". */
const normalizeLevel = (name: string) => name.replace(/\s+/g, "").toLowerCase();

export class FeeStructureService {
  private static mapToResponse(fs: any) {
    return {
      id: fs.id,
      name: fs.name,
      amount: Number(fs.amount),
      type: fs.type as FeeStructureType,
      applicableLevels: fs.type === "base" ? fs.applicableLevels || [] : [],
    };
  }

  static async getStructures(schoolId: string) {
    const structures = await prisma.feeStructure.findMany({
      where: { schoolId },
      orderBy: { createdAt: "asc" },
    });
    return successResponse(structures.map((fs) => this.mapToResponse(fs)), "Fee structures retrieved.");
  }

  static async createStructure(schoolId: string, request: any) {
    const structure = await prisma.feeStructure.create({
      data: {
        schoolId,
        name: request.name.trim(),
        amount: request.amount,
        type: request.type,
        applicableLevels: request.type === "base" ? request.applicableLevels || [] : [],
      },
    });
    return successResponse(this.mapToResponse(structure), "Fee structure created.");
  }

  static async updateStructure(schoolId: string, id: string, request: any) {
    const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!existing) return failResponse("Fee structure not found.");

    const type = request.type ?? existing.type;
    const structure = await prisma.feeStructure.update({
      where: { id },
      data: {
        name: request.name !== undefined ? request.name.trim() : undefined,
        amount: request.amount !== undefined ? request.amount : undefined,
        type,
        applicableLevels: type === "base"
          ? (request.applicableLevels !== undefined ? request.applicableLevels : existing.applicableLevels)
          : [],
      },
    });

    // A fee switched from custom to base no longer needs per-student assignments
    if (existing.type === "custom" && type === "base") {
      await prisma.studentCustomFee.deleteMany({ where: { schoolId, feeStructureId: id } });
    }

    return successResponse(this.mapToResponse(structure), "Fee structure updated.");
  }

  static async deleteStructure(schoolId: string, id: string) {
    const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!existing) return failResponse("Fee structure not found.");

    // Student assignments are removed by the cascade
    await prisma.feeStructure.delete({ where: { id } });
    return successResponse(true, "Fee structure deleted.");
  }

  /** Returns a map of studentId -> assigned custom fee structure IDs. */
  static async getStudentCustomFees(schoolId: string) {
    const assignments = await prisma.studentCustomFee.findMany({
      where: { schoolId },
      select: { studentId: true, feeStructureId: true },
    });

    const map: Record<string, string[]> = {};
    for (const a of assignments) {
      (map[a.studentId] ||= []).push(a.feeStructureId);
    }
    return successResponse(map, "Student custom fees retrieved.");
  }

  /** Replaces the custom fees assigned to a student. */
  static async setStudentCustomFees(schoolId: string, studentId: string, feeStructureIds: string[]) {
    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId }, select: { id: true } });
    if (!student) return failResponse("Student not found.");

    const uniqueIds = [...new Set(feeStructureIds)];
    const customFees = await prisma.feeStructure.findMany({
      where: { schoolId, type: "custom", id: { in: uniqueIds } },
      select: { id: true },
    });
    if (customFees.length !== uniqueIds.length) {
      return failResponse("One or more fees are not custom fees of this school.");
    }

    await prisma.$transaction([
      prisma.studentCustomFee.deleteMany({ where: { schoolId, studentId } }),
      prisma.studentCustomFee.createMany({
        data: uniqueIds.map((feeStructureId) => ({ schoolId, studentId, feeStructureId })),
      }),
    ]);

    return successResponse({ studentId, feeStructureIds: uniqueIds }, "Student custom fees updated.");
  }

  /** The fees that apply to the logged-in student, for the student portal. */
  static async getMyFees(schoolId: string, userId: string) {
    const student = await prisma.student.findFirst({
      where: { schoolId, userId },
      select: { id: true, class: { select: { name: true } } },
    });
    if (!student) return failResponse("Student profile not found.");

    const [structures, assignments] = await Promise.all([
      prisma.feeStructure.findMany({ where: { schoolId }, orderBy: { createdAt: "asc" } }),
      prisma.studentCustomFee.findMany({ where: { schoolId, studentId: student.id }, select: { feeStructureId: true } }),
    ]);

    const level = student.class?.name ? normalizeLevel(student.class.name) : "";
    const assignedIds = new Set(assignments.map((a) => a.feeStructureId));
    const fees = structures
      .filter((fs) => fs.type === "base"
        ? fs.applicableLevels.some((l) => l === "All" || (level && normalizeLevel(l) === level))
        : assignedIds.has(fs.id))
      .map((fs) => this.mapToResponse(fs));

    return successResponse({
      fees,
      total: fees.reduce((sum, fee) => sum + fee.amount, 0),
    }, "Student fees retrieved.");
  }

  /**
   * Computes what each student owes per term from the school's fee structures:
   * base fees for their class level (or "All") plus their assigned custom fees.
   */
  static async computeExpectedAmounts(
    schoolId: string,
    students: Array<{ id: string; className?: string | null }>
  ): Promise<Map<string, number>> {
    const [structures, assignments] = await Promise.all([
      prisma.feeStructure.findMany({ where: { schoolId } }),
      prisma.studentCustomFee.findMany({
        where: { schoolId, studentId: { in: students.map((s) => s.id) } },
        select: { studentId: true, feeStructureId: true },
      }),
    ]);

    const baseFees = structures.filter((fs) => fs.type === "base");
    const customAmounts = new Map(
      structures.filter((fs) => fs.type === "custom").map((fs) => [fs.id, Number(fs.amount)])
    );

    const expected = new Map<string, number>();
    for (const student of students) {
      const level = student.className ? normalizeLevel(student.className) : "";
      let total = 0;
      for (const fee of baseFees) {
        if (fee.applicableLevels.some((l) => l === "All" || (level && normalizeLevel(l) === level))) {
          total += Number(fee.amount);
        }
      }
      expected.set(student.id, total);
    }
    for (const a of assignments) {
      expected.set(a.studentId, (expected.get(a.studentId) || 0) + (customAmounts.get(a.feeStructureId) || 0));
    }
    return expected;
  }

  /**
   * Term fee totals for the bursar: expected, collected and outstanding across active students.
   * A student's expected amount is their recorded amount due for the term, or what their
   * fee structures add up to when no payment has been recorded yet.
   */
  static async getTermSummary(schoolId: string, termId?: string) {
    const term = termId
      ? await prisma.term.findFirst({ where: { id: termId, academicSession: { schoolId } }, include: { academicSession: true } })
      : await prisma.term.findFirst({ where: { isCurrent: true, academicSession: { schoolId, isCurrent: true } }, include: { academicSession: true } });

    if (!term) {
      return failResponse(termId ? "Term not found." : "No current term is set for this school.");
    }

    const [students, payments] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId, status: "Active" },
        select: { id: true, class: { select: { name: true } } },
      }),
      prisma.feePayment.findMany({
        where: { schoolId, termId: term.id },
        select: { studentId: true, amountDue: true, amountPaid: true, status: true },
      }),
    ]);

    const expectedFromStructures = await this.computeExpectedAmounts(
      schoolId,
      students.map((s) => ({ id: s.id, className: s.class?.name }))
    );
    const paymentByStudent = new Map(payments.map((p) => [p.studentId, p]));

    let totalExpected = 0;
    let totalOutstanding = 0;
    let clearedCount = 0;
    for (const student of students) {
      const payment = paymentByStudent.get(student.id);
      const expected = payment ? Number(payment.amountDue) : expectedFromStructures.get(student.id) || 0;
      const paid = payment ? Number(payment.amountPaid) : 0;
      totalExpected += expected;
      totalOutstanding += Math.max(expected - paid, 0);
      if (payment?.status === "Cleared" || (expected > 0 && paid >= expected)) clearedCount++;
    }
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

    return successResponse({
      termId: term.id,
      termName: term.termNumber,
      sessionName: term.academicSession.name,
      studentsCount: students.length,
      clearedCount,
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 1000) / 10 : 0,
    }, "Term fee summary retrieved.");
  }
}
