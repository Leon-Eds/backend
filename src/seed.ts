import { prisma } from "./config/db";
import { hashPassword } from "./utils/bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Starting database seed...");

  const testSlug = "leoned-test-academy";

  // 1. Cleanup existing school and associated data
  const existingSchool = await prisma.school.findUnique({
    where: { slug: testSlug }
  });

  if (existingSchool) {
    console.log("Found existing test school. Cleaning up associated records...");
    
    // Delete users associated with this school to avoid orphan records (User.schoolId is SetNull on cascade)
    await prisma.user.deleteMany({
      where: { schoolId: existingSchool.id }
    });
    
    // Delete parent records manually as well, just in case
    await prisma.parent.deleteMany({
      where: { schoolId: existingSchool.id }
    });

    // Delete the school itself (cascades to Teacher, Student, Class, AcademicSession, Subject, GradingRule, etc.)
    await prisma.school.delete({
      where: { id: existingSchool.id }
    });

    console.log("Cleanup complete.");
  }

  // 2. Ensure PaymentPlan "Silver" exists
  let silverPlan = await prisma.paymentPlan.findUnique({
    where: { name: "Silver" }
  });

  if (!silverPlan) {
    console.log("Creating PaymentPlan 'Silver'...");
    silverPlan = await prisma.paymentPlan.create({
      data: {
        name: "Silver",
        amount: 15000.00,
        maxTeachers: 50,
        maxStudents: 500,
        isActive: true,
        paystackPlanCode: "PLN_silver_test"
      }
    });
  } else {
    console.log("PaymentPlan 'Silver' already exists.");
  }

  // 3. Create the School
  console.log("Creating school...");
  const school = await prisma.school.create({
    data: {
      name: "LeonEd Test Academy",
      slug: testSlug,
      address: "123 Test Street, Lagos",
      contactEmail: "admin@leonedtest.com",
      contactPhone: "+2348012345678",
      schoolType: "Co-educational",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      subscriptionPlan: "Premium",
      subscriptionStatus: "Active",
      isActive: true,
      planId: silverPlan.id,
      schoolTheme: {
        primaryColor: "#059669",
        secondaryColor: "#10b981",
        accentColor: "#f59e0b",
        font: "Outfit"
      }
    }
  });

  // 4. Create SchoolAdmin User
  console.log("Creating SchoolAdmin user...");
  const adminPasswordHash = await hashPassword("Admin@123!");
  const adminUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      name: "School Administrator",
      email: "admin@leonedtest.com",
      passwordHash: adminPasswordHash,
      role: "SchoolAdmin",
      isActive: true,
      isVerified: true
    }
  });

  // 5. Create 10 Teachers
  console.log("Creating 10 teachers...");
  const teachers = [];
  const teacherPasswordHash = await hashPassword("Teacher@123!");

  for (let i = 1; i <= 10; i++) {
    const email = `teacher${i}@leonedtest.com`;
    const fullName = `Teacher ${i}`;
    
    const user = await prisma.user.create({
      data: {
        schoolId: school.id,
        name: fullName,
        email,
        passwordHash: teacherPasswordHash,
        role: "Teacher",
        isActive: true,
        isVerified: true
      }
    });

    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        fullName,
        email,
        phone: `+23480300000${String(i).padStart(2, "0")}`,
        isActive: true
      }
    });
    
    teachers.push(teacher);
  }

  // 6. Create Academic Session & Terms
  console.log("Creating Academic Session and Terms...");
  const academicSession = await prisma.academicSession.create({
    data: {
      schoolId: school.id,
      name: "2026/2027 Academic Session",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-07-31"),
      isCurrent: true
    }
  });

  const termFirst = await prisma.term.create({
    data: {
      academicSessionId: academicSession.id,
      termNumber: "First",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-18"),
      isCurrent: true
    }
  });

  await prisma.term.create({
    data: {
      academicSessionId: academicSession.id,
      termNumber: "Second",
      startDate: new Date("2027-01-10"),
      endDate: new Date("2027-04-05"),
      isCurrent: false
    }
  });

  await prisma.term.create({
    data: {
      academicSessionId: academicSession.id,
      termNumber: "Third",
      startDate: new Date("2027-04-25"),
      endDate: new Date("2027-07-20"),
      isCurrent: false
    }
  });

  // 7. Create Subjects
  console.log("Creating subjects...");
  const subjectData = [
    { name: "Mathematics", code: "MTH" },
    { name: "English Language", code: "ENG" },
    { name: "Basic Science", code: "BSC" },
    { name: "Social Studies", code: "SST" },
    { name: "Agricultural Science", code: "AGR" }
  ];

  const subjects = [];
  for (const sub of subjectData) {
    const subject = await prisma.subject.create({
      data: {
        schoolId: school.id,
        name: sub.name,
        code: sub.code
      }
    });
    subjects.push(subject);
  }

  // 8. Create 5 Basic Classes
  console.log("Creating 5 basic classes...");
  const basicClassNames = ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5"];
  const basicClasses = [];
  for (let i = 0; i < basicClassNames.length; i++) {
    const name = basicClassNames[i];
    const formTeacher = teachers[i % teachers.length];
    const cls = await prisma.class.create({
      data: {
        schoolId: school.id,
        academicSessionId: academicSession.id,
        name,
        arm: "",
        level: i + 1,
        formTeacherId: formTeacher.id
      }
    });
    basicClasses.push(cls);
  }

  // 9. Create 18 Secondary Classes (Jss1, Jss2, Jss3, SSS1, SSS2, SSS3; A to C for each)
  console.log("Creating 18 secondary classes...");
  const secondaryLevels = [
    { name: "JSS 1", level: 7 },
    { name: "JSS 2", level: 8 },
    { name: "JSS 3", level: 9 },
    { name: "SSS 1", level: 10 },
    { name: "SSS 2", level: 11 },
    { name: "SSS 3", level: 12 }
  ];
  const arms = ["A", "B", "C"];
  const secondaryClasses = [];

  let teacherIdx = 0;
  for (const lvl of secondaryLevels) {
    for (const arm of arms) {
      const formTeacher = teachers[teacherIdx % teachers.length];
      teacherIdx++;
      
      const cls = await prisma.class.create({
        data: {
          schoolId: school.id,
          academicSessionId: academicSession.id,
          name: lvl.name,
          arm,
          level: lvl.level,
          formTeacherId: formTeacher.id
        }
      });
      secondaryClasses.push(cls);
    }
  }

  const allClasses = [...basicClasses, ...secondaryClasses];

  // 10. Assign Subjects and Teachers to Classes
  console.log("Assigning subjects and teachers to classes...");
  for (const cls of allClasses) {
    for (const subject of subjects) {
      await prisma.classSubject.create({
        data: {
          classId: cls.id,
          subjectId: subject.id
        }
      });

      // Assign teacher to this subject in class
      const teacher = teachers[Math.floor(Math.random() * teachers.length)];
      await prisma.teacherSubjectAssignment.create({
        data: {
          teacherId: teacher.id,
          subjectId: subject.id,
          classId: cls.id
        }
      });
    }
  }

  // 11. Create Grading Rules
  console.log("Creating default grading rules...");
  const gradingRulesData = [
    { grade: "A" as const, minScore: 75, maxScore: 100, remark: "Excellent" },
    { grade: "B" as const, minScore: 60, maxScore: 74, remark: "Very Good" },
    { grade: "C" as const, minScore: 50, maxScore: 59, remark: "Good" },
    { grade: "D" as const, minScore: 45, maxScore: 49, remark: "Pass" },
    { grade: "E" as const, minScore: 40, maxScore: 44, remark: "Weak Pass" },
    { grade: "F" as const, minScore: 0, maxScore: 39, remark: "Fail" }
  ];

  for (const rule of gradingRulesData) {
    await prisma.gradingRule.create({
      data: {
        schoolId: school.id,
        grade: rule.grade,
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        remark: rule.remark
      }
    });
  }

  // 12. Create 10 Students for each Class (23 classes * 10 = 230 students total)
  console.log("Creating students and parents...");
  const studentPasswordHash = await hashPassword("Student@123!");
  const studentsList = [];
  let totalStudentsCreated = 0;

  for (let cIdx = 0; cIdx < allClasses.length; cIdx++) {
    const cls = allClasses[cIdx];
    for (let sIdx = 1; sIdx <= 10; sIdx++) {
      totalStudentsCreated++;
      const seq = String(totalStudentsCreated).padStart(4, "0");
      const admissionNumber = `LTA-2026-${seq}`;
      const studentEmail = `${admissionNumber.toLowerCase()}@student.leoned.com`;
      const studentName = `Student ${sIdx} of ${cls.name} ${cls.arm}`.trim();
      
      const user = await prisma.user.create({
        data: {
          schoolId: school.id,
          name: studentName,
          email: studentEmail,
          passwordHash: studentPasswordHash,
          role: "Student",
          isActive: true,
          isVerified: true
        }
      });

      const parentEmail = `parent-${totalStudentsCreated}@leonedtest.com`;
      const parent = await prisma.parent.create({
        data: {
          schoolId: school.id,
          fullName: `Parent of ${studentName}`,
          email: parentEmail,
          phone: `+234803${String(totalStudentsCreated).padStart(7, "0")}`
        }
      });

      const student = await prisma.student.create({
        data: {
          schoolId: school.id,
          classId: cls.id,
          userId: user.id,
          parentId: parent.id,
          fullName: studentName,
          admissionNumber,
          gender: sIdx % 2 === 0 ? "Male" : "Female",
          dateOfBirth: new Date(2010 + (cIdx % 5), sIdx % 12, sIdx + 1),
          arm: cls.arm || null,
          status: "Active"
        }
      });
      studentsList.push(student);
    }
  }

  // 13. Create Fee Payments for all students (First Term)
  console.log("Creating fee payments for students...");
  for (const student of studentsList) {
    const isPaid = student.gender === "Male";
    await prisma.feePayment.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        termId: termFirst.id,
        academicSessionId: academicSession.id,
        amountDue: 50000.00,
        amountPaid: isPaid ? 50000.00 : 0.00,
        status: isPaid ? "Cleared" : "Pending",
        clearedByUserId: isPaid ? adminUser.id : null,
        clearedAt: isPaid ? new Date() : null
      }
    });
  }

  // 14. Create Sample Scores
  console.log("Creating sample scores...");
  for (const cls of allClasses) {
    const classStudents = studentsList.filter(s => s.classId === cls.id).slice(0, 3);
    for (const student of classStudents) {
      const assignment = await prisma.teacherSubjectAssignment.findFirst({
        where: { classId: cls.id, subjectId: subjects[0].id }
      });
      const teacherId = assignment?.teacherId || null;

      await prisma.score.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          subjectId: subjects[0].id,
          classId: cls.id,
          termId: termFirst.id,
          academicSessionId: academicSession.id,
          firstCA: 15.00,
          secondCA: 12.50,
          exam: 52.00,
          total: 79.50,
          grade: "A",
          remark: "Excellent performance",
          enteredByTeacherId: teacherId
        }
      });
    }
  }

  // 15. Create Sample Attendance records
  console.log("Creating sample attendance...");
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  for (const cls of allClasses) {
    const classStudents = studentsList.filter(s => s.classId === cls.id).slice(0, 5);
    const teacher = teachers[0];

    for (const student of classStudents) {
      await prisma.attendance.create({
        data: {
          schoolId: school.id,
          classId: cls.id,
          studentId: student.id,
          date: yesterday,
          status: "Present",
          remarks: "Arrived on time",
          takenByTeacherId: teacher.id
        }
      });
      
      await prisma.attendance.create({
        data: {
          schoolId: school.id,
          classId: cls.id,
          studentId: student.id,
          date: today,
          status: Math.random() > 0.8 ? "Absent" : "Present",
          remarks: "",
          takenByTeacherId: teacher.id
        }
      });
    }
  }

  // 16. Create Announcements
  console.log("Creating sample announcements...");
  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      createdByUserId: adminUser.id,
      title: "Welcome to LeonEd Test Academy!",
      content: "We are excited to launch our new portal. Please explore the features and provide feedback.",
      audience: "All"
    }
  });

  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      createdByUserId: adminUser.id,
      title: "Teacher Briefing",
      content: "Please ensure all CA scores for the first term are uploaded by the end of the week.",
      audience: "Teachers"
    }
  });

  console.log("Database seeded successfully!");
  console.log("-----------------------------------------");
  console.log("Test Login Credentials:");
  console.log(`School Admin: Email = admin@leonedtest.com, Password = Admin@123!`);
  console.log(`Teachers: Emails = teacher1@leonedtest.com to teacher10@leonedtest.com, Password = Teacher@123!`);
  console.log(`Students: Emails = lta-2026-0001@student.leoned.com to lta-2026-0230@student.leoned.com, Password = Student@123!`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
