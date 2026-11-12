import test from "node:test";
import assert from "node:assert/strict";
import { ReportCardService } from "../services/report-card.service";
import { ResultService } from "../services/result.service";
import { PdfGenerator } from "../utils/pdf-generator";

const studentResult = {
  studentName: "Ada Okafor",
  admissionNumber: "GMC/001",
  className: "JSS 1 A",
  gender: "Female",
  termName: "First",
  sessionName: "2026/2027",
  classSize: 30,
  position: 2,
  totalScore: 160,
  average: 80,
  daysSchoolOpened: 60,
  daysPresent: 0,
  nextTermBegins: "5th January, 2027",
  promotedTo: "JSS 2 A",
  teacherComment: "",
  passportUrl: "",
  schoolInfo: { name: "Greenfield College", address: "12 School Rd", logoUrl: "" },
  affectiveDomains: { punctuality: 3, neatness: 4, politeness: 5, honesty: 2, cooperation: 4, peerRelationship: 1 },
  psychomotorDomains: { handwriting: 2, publicSpeaking: 3, sports: 4, clubParticipation: 1, craftSkills: 5, musicalSkill: 2 },
  subjectScores: [
    { subjectName: "English", firstCA: 0, secondCA: 18, exam: 55, total: 73, grade: "A", classAvg: 61.25, subjectPosition: 3 },
    { subjectName: "Maths", firstCA: 20, secondCA: 20, exam: 47, total: 87, grade: "A", classAvg: 70, subjectPosition: 1 },
  ],
};

test("report card PDF uses the student's real result data, not placeholders", async () => {
  const originals = { getStudentResult: ResultService.getStudentResult, render: PdfGenerator.renderTemplateToPdf };
  let templateData: any;
  try {
    (ResultService as any).getStudentResult = async () => ({ success: true, data: studentResult });
    (PdfGenerator as any).renderTemplateToPdf = async (_name: string, data: any) => {
      templateData = data;
      return Buffer.from("pdf");
    };

    const result: any = await ReportCardService.generateReportCardPdf("school", "student", "term");
    assert.equal(result.success, true);

    assert.equal(templateData.daysOpened, 60);
    assert.equal(templateData.daysPresent, 0); // a real zero, not days opened
    assert.equal(templateData.promotedTo, "JSS 2 A"); // not the current class
    assert.equal(templateData.position, "2nd");
    assert.equal(templateData.averageScore, "80.0");
    assert.equal(templateData.punctualityScore, 3); // the teacher's rating, not a hardcoded 5
    assert.equal(templateData.craftScore, 5);
    assert.equal(templateData.peerRelationshipScore, 1);
    assert.equal(templateData.grades[0].classAvg, "61.3"); // the subject's own class average
    assert.equal(templateData.grades[1].classAvg, "70.0");
    assert.equal(templateData.grades[0].pos, "3rd");
    assert.equal(templateData.grades[0].ca1, 0);
    assert.equal(templateData.teacherRemark, "-"); // no invented remark
  } finally {
    (ResultService as any).getStudentResult = originals.getStudentResult;
    (PdfGenerator as any).renderTemplateToPdf = originals.render;
  }
});
