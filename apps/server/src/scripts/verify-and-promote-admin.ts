import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "amoahjerry835@gmail.com";
  console.log(`Checking DB for user ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!user) {
    console.log(`User ${email} not found in DB!`);
    process.exit(1);
  }

  console.log(
    `Found user: id=${user.id}, email=${user.email}, role=${user.role}, emailVerified=${user.emailVerified}`
  );
  console.log(
    `Accounts:`,
    user.accounts.map((a) => ({ id: a.id, providerId: a.providerId, hasPassword: !!a.password }))
  );

  const updated = await prisma.user.update({
    where: { email },
    data: {
      role: UserRole.ADMIN,
      isSuperAdmin: true,
      emailVerified: true,
    },
  });

  console.log(
    `SUCCESS: Upgraded user ${updated.email} to role=${updated.role}, isSuperAdmin=${updated.isSuperAdmin}, emailVerified=${updated.emailVerified}`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
