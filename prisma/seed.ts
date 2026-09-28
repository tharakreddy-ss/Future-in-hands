import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const [superHash, adminHash, teacherHash, studentHash] = await Promise.all([
    bcrypt.hash("SuperAdmin@123", 12),
    bcrypt.hash("Admin@123", 12),
    bcrypt.hash("Teacher@123", 12),
    bcrypt.hash("Student@123", 12),
  ]);

  await db.user.upsert({
    where: { email: "superadmin@mocktestai.com" },
    update: { name: "Platform Super Admin", passwordHash: superHash, role: "SUPER_ADMIN", isActive: true },
    create: {
      email: "superadmin@mocktestai.com",
      name: "Platform Super Admin",
      passwordHash: superHash,
      role: "SUPER_ADMIN",
    },
  });

  const institution = await db.institution.upsert({
    where: { slug: "demo-academy" },
    update: { name: "Demo Academy", status: "ACTIVE" },
    create: {
      name: "Demo Academy",
      slug: "demo-academy",
      email: "admin@demoacademy.com",
      status: "ACTIVE",
    },
  });

  await db.user.upsert({
    where: { email: "admin@demoacademy.com" },
    update: {
      name: "Demo Institution Admin",
      passwordHash: adminHash,
      role: "INSTITUTION_ADMIN",
      institutionId: institution.id,
      isActive: true,
    },
    create: {
      email: "admin@demoacademy.com",
      name: "Demo Institution Admin",
      passwordHash: adminHash,
      role: "INSTITUTION_ADMIN",
      institutionId: institution.id,
    },
  });

  await db.user.upsert({
    where: { email: "teacher@demoacademy.com" },
    update: {
      name: "Anita Sharma",
      passwordHash: teacherHash,
      role: "TEACHER",
      institutionId: institution.id,
      isActive: true,
    },
    create: {
      email: "teacher@demoacademy.com",
      name: "Anita Sharma",
      passwordHash: teacherHash,
      role: "TEACHER",
      institutionId: institution.id,
    },
  });

  const studentUser = await db.user.upsert({
    where: { email: "ravi.kumar@demoacademy.com" },
    update: {
      name: "Ravi Kumar",
      passwordHash: studentHash,
      role: "STUDENT",
      institutionId: institution.id,
      isActive: true,
    },
    create: {
      email: "ravi.kumar@demoacademy.com",
      name: "Ravi Kumar",
      passwordHash: studentHash,
      role: "STUDENT",
      institutionId: institution.id,
    },
  });

  await db.student.upsert({
    where: { userId: studentUser.id },
    update: {
      studentIdentifier: "STU001",
      firstName: "Ravi",
      lastName: "Kumar",
      email: studentUser.email,
      status: "ACTIVE",
      institutionId: institution.id,
    },
    create: {
      userId: studentUser.id,
      institutionId: institution.id,
      studentIdentifier: "STU001",
      firstName: "Ravi",
      lastName: "Kumar",
      email: studentUser.email,
      status: "ACTIVE",
    },
  });

  console.log("Demo credentials ready.");
  console.log("  Super Admin         superadmin@mocktestai.com / SuperAdmin@123");
  console.log("  Institution Admin   admin@demoacademy.com / Admin@123");
  console.log("  Teacher             teacher@demoacademy.com / Teacher@123");
  console.log("  Student             STU001 / Student@123");
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
