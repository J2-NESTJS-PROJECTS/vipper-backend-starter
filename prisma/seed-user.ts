import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function parseRoleType(value: string): RoleType {
  const normalized = value.trim().toUpperCase();

  if (!Object.values(RoleType).includes(normalized as RoleType)) {
    throw new Error(
      `Invalid SEED_USER_ROLE: ${value}. Valid values: ${Object.values(RoleType).join(', ')}`,
    );
  }

  return normalized as RoleType;
}

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'info@unitystores.com';
  const username = process.env.SEED_USER_USERNAME ?? 'unitystores';
  const rawPassword = process.env.SEED_USER_PASSWORD ?? 'Un1tySt0r3s123!';
  const firstName = process.env.SEED_USER_FIRST_NAME ?? 'Unity';
  const lastName = process.env.SEED_USER_LAST_NAME ?? 'VTEX';
  const roleName = parseRoleType(process.env.SEED_USER_ROLE ?? RoleType.API_CLIENT);

  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(
      `Role ${roleName} does not exist. Run npm run prisma:seed first or create the role manually.`,
    );
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: role.id,
      isActive: true,
    },
    create: {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: role.id,
      isActive: true,
    },
  });

  console.log(
    `User seeded successfully: email=${user.email}, username=${user.username}, role=${roleName}`,
  );
}

//main()
//  .catch((e) => {
//    console.error(e);
//    process.exit(1);
//  })
//  .finally(async () => {
//    await prisma.$disconnect();
//  });

(async () => {
  try {
    await main()
  } catch (e) {
    console.log(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
