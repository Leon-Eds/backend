import { prisma } from "../config/db";
import { successResponse, failResponse } from "../utils/response";
import { GradingService } from "./grading.service";
import { formatOrdinal } from "../utils/ordinal";
import { PdfGenerator } from "../utils/pdf-generator";

export class ReportCardService {
  static async generateReportCard(schoolId: string, studentId: string, termId: string) {
    const result = await prisma.result.findFirst({
      where: { schoolId, studentId, termId },
      include: {
        student: true,
        class: {
          include: {
            formTeacher: true,
          },
        },
        term: {
          include: { academicSession: true },
        },
      },
    });

    if (!result) {
      return failResponse("Result not found for this student and term.");
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return failResponse("School not found.");
    }

    const totalInClass = await prisma.result.count({
      where: { schoolId, classId: result.classId, termId },
    });

    const scores = await prisma.score.findMany({
      where: { schoolId, studentId, termId },
      include: { subject: true },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    // Fetch all class scores for term to calculate fallback rank if s.subjectPosition is 0
    const allClassScores = await prisma.score.findMany({
      where: { schoolId, classId: result.classId, termId },
      select: { subjectId: true, total: true },
    });

    const subjectTotalsMap = new Map<string, number[]>();
    for (const sc of allClassScores) {
      const arr = subjectTotalsMap.get(sc.subjectId) || [];
      arr.push(Number(sc.total));
      subjectTotalsMap.set(sc.subjectId, arr);
    }

    const gradingRulesResult = await GradingService.getGradingRules(schoolId);

    const formTeacherInfo = {
      name: result.class?.formTeacher?.fullName || "",
      signatureUrl: result.class?.formTeacher?.signatureUrl || "",
    };

    const reportCard = {
      schoolName: school.name,
      schoolAddress: school.address,
      schoolEmail: school.contactEmail,
      schoolPhone: school.contactPhone,
      schoolLogoUrl: school.logoUrl,
      studentName: result.student.fullName,
      admissionNumber: result.student.admissionNumber,
      className: result.class ? `${result.class.name} ${result.class.arm}`.trim() : "",
      gender: result.student.gender,
      academicSession: result.term.academicSession.name,
      term: result.term.termNumber,
      totalScore: Number(result.totalScore),
      average: Number(result.average),
      classAverage: Number(result.classAverage),
      position: result.position,
      totalStudentsInClass: totalInClass,
      classSize: totalInClass,
      formTeacherName: formTeacherInfo.name,
      formTeacherSignatureUrl: formTeacherInfo.signatureUrl,
      formTeacherInfo,
      resultMetadata: {
        classSize: totalInClass,
        totalStudentsInClass: totalInClass,
        formTeacherName: formTeacherInfo.name,
        formTeacherSignatureUrl: formTeacherInfo.signatureUrl,
        principalName: school.principalName || "",
        principalSignatureUrl: school.principalSignatureUrl || "",
      },
      subjectCount: result.subjectCount,
      teacherComment: result.teacherComment,
      adminComment: result.adminComment,
      studentPictureUrl: result.student.profilePictureUrl || "",
      subjectScores: scores.map((s) => {
        let pos = s.subjectPosition || 0;
        if (pos === 0) {
          const totals = subjectTotalsMap.get(s.subjectId) || [];
          const higherCount = totals.filter((t) => t > Number(s.total)).length;
          pos = higherCount + 1;
        }
        return {
          id: s.id,
          studentId: s.studentId,
          studentName: result.student.fullName,
          admissionNumber: result.student.admissionNumber,
          subjectId: s.subjectId,
          subjectName: s.subject.name,
          firstCA: Number(s.firstCA),
          secondCA: Number(s.secondCA),
          exam: Number(s.exam),
          total: Number(s.total),
          grade: s.grade,
          remark: formatOrdinal(pos),
          subjectPosition: pos,
        };
      }),

      gradingKey: (gradingRulesResult.data || []).map((g: any) => ({
        grade: g.grade,
        minScore: g.minScore,
        maxScore: g.maxScore,
        remark: g.remark,
      })),
    };

    return successResponse(reportCard, "Report card generated.");
  }

  static async generateReportCardPdf(schoolId: string, studentId: string, termId: string): Promise<any> {
    const reportCardResult = await this.generateReportCard(schoolId, studentId, termId);
    if (!reportCardResult.success || !reportCardResult.data) {
      return failResponse(reportCardResult.message);
    }

    const data = reportCardResult.data;

    // Fetch term info for daysOpened, nextTermBegins
    const term = await prisma.term.findFirst({
      where: { id: termId },
      include: { academicSession: true }
    });

    // Map grades for template
    const grades = (data.subjectScores || []).map((s: any, idx: number) => ({
      subjectName: s.subjectName,
      ca1: s.firstCA,
      ca2: s.secondCA,
      exam: s.exam,
      total: s.total,
      grade: s.grade,
      classAvg: data.classAverage ? data.classAverage.toFixed(1) : "-",
      pos: s.subjectPosition ? formatOrdinal(s.subjectPosition) : "-",
      remark: s.grade === "A" ? "Excellent" : s.grade === "B" ? "Very Good" : s.grade === "C" ? "Good" : s.grade === "D" ? "Fair" : s.grade === "E" ? "Poor" : "Fail",
      rowBgClass: idx % 2 === 0 ? "bg-[#f8fafc]" : "bg-white",
    }));

    const maxPossibleScore = (data.subjectScores || []).length * 100;
    const termLabel = `${term?.termNumber || data.term} Term`.toUpperCase();
    const formattedNextTermBegins = term?.nextTermBegins 
      ? new Date(term.nextTermBegins).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "TBD";

    const templateData = {
      schoolName: data.schoolName,
      schoolAddress: data.schoolAddress || "LeonEd School System",
      schoolLogo: data.schoolLogoUrl,
      schoolInitial: data.schoolName ? data.schoolName.charAt(0).toUpperCase() : "S",
      termLabel,
      studentName: data.studentName,
      admissionNumber: data.admissionNumber,
      className: data.className,
      gender: data.gender,
      sessionName: data.academicSession,
      classSize: data.classSize,
      position: data.position ? formatOrdinal(data.position) : "N/A",
      daysOpened: term?.daysSchoolOpened || "N/A",
      daysPresent: term?.daysSchoolOpened || "N/A",
      nextTermBegins: formattedNextTermBegins,
      studentPassport: data.studentPictureUrl,
      grades,
      totalStudentScore: data.totalScore,
      maxPossibleScore,
      averageScore: data.average ? data.average.toFixed(1) : 0,
      punctualityScore: 5,
      neatnessScore: 5,
      politenessScore: 5,
      honestyScore: 5,
      cooperationScore: 5,
      peerRelationshipScore: 5,
      handwritingScore: 4,
      publicSpeakingScore: 4,
      sportsScore: 5,
      clubParticipationScore: 4,
      craftScore: 4,
      musicalSkillScore: 3,
      teacherRemark: data.teacherComment || "An encouraging performance. Keep working hard to maintain high academic standards.",
      teacherSignature: data.formTeacherSignatureUrl,
      teacherName: data.formTeacherName || "Form Teacher",
      principalSignature: data.resultMetadata?.principalSignatureUrl,
      principalName: data.resultMetadata?.principalName || "Principal",
      promotedTo: data.className,
    };

    const pdfBuffer = await PdfGenerator.renderTemplateToPdf("report_card", templateData, {
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
    });

    return successResponse(pdfBuffer, "Report card PDF generated successfully.");
  }
}
