import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const emailA = process.env.SEED_USER_A_EMAIL ?? "usera@example.com";
  const passA = process.env.SEED_USER_A_PASS ?? "UserA123!";
  const nameA = process.env.SEED_USER_A_NAME ?? "User A";

  const emailB = process.env.SEED_USER_B_EMAIL ?? "userb@example.com";
  const passB = process.env.SEED_USER_B_PASS ?? "UserB123!";
  const nameB = process.env.SEED_USER_B_NAME ?? "User B";

  const hashA = await bcrypt.hash(passA, 10);
  const hashB = await bcrypt.hash(passB, 10);

  const userA = await prisma.user.upsert({
    where: { email: emailA },
    update: {},
    create: {
      email: emailA,
      name: nameA,
      passwordHash: hashA,
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: emailB },
    update: {},
    create: {
      email: emailB,
      name: nameB,
      passwordHash: hashB,
    },
  });

  console.log("Seed OK: User A", userA.email, "| User B", userB.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
