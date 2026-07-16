import { prisma } from "../config/db";

async function main() {
  const classId = "db105382-d1f2-4ccc-84aa-45bfb9ebf527";

  console.log("=== Querying Class ===");
  const classObj = await prisma.class.findUnique({
    where: { id: classId },
  });
  console.log("Class:", classObj);

  if (classObj) {
    console.log("\n=== Querying Students in Class ===");
    const students = await prisma.student.findMany({
      where: { classId },
    });
    console.log(`Students in class ${classObj.name}:`, students);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
