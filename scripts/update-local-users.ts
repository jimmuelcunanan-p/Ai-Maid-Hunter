import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.updateMany({
    where: { role: "ADMIN" },
    data: { name: "RinzinAgency Admin", email: "admin@gmail.com", passwordHash },
  });
  await prisma.user.updateMany({
    where: { role: "RECRUITER" },
    data: { name: "jimmuel" },
  });

  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true },
    orderBy: { role: "asc" },
  });
  console.log(JSON.stringify(users, null, 2));
} finally {
  await prisma.$disconnect();
}
