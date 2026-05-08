import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parseOptionalDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid SEED_API_CREDENTIAL_EXPIRES_AT value: ${value}`);
  }

  return parsed;
}

async function main() {
  console.log(process.env.SEED_API_CREDENTIAL_USER)
  console.log({credentialKey:process.env.SEED_API_CREDENTIAL_KEY})
  const userIdentifier = process.env.SEED_API_CREDENTIAL_USER ?? process.env.API_AUTH_USER;
  if (!userIdentifier) {
    throw new Error(
      'SEED_API_CREDENTIAL_USER or API_AUTH_USER is required to seed an API credential.',
    );
  }

  const name = process.env.SEED_API_CREDENTIAL_NAME ?? 'Default API Credential';
  const plainKey = process.env.SEED_API_CREDENTIAL_KEY ?? randomBytes(24).toString('hex');
  const plainToken = process.env.SEED_API_CREDENTIAL_TOKEN ?? randomBytes(32).toString('hex');
  const expiresAt = parseOptionalDate(process.env.SEED_API_CREDENTIAL_EXPIRES_AT);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: userIdentifier }, { email: userIdentifier }],
    },
  });

  if (!user) {
    throw new Error(
      `User ${userIdentifier} does not exist. Seed or create the API client user first.`,
    );
  }

  const keyHash = sha256(plainKey);
  const tokenHash = sha256(plainToken);
  console.log({plainKey})
  const credential = await prisma.apiCredential.upsert({
    where: { keyHash },
    update: {
      name,
      tokenHash,
      userId: user.id,
      isActive: true,
      expiresAt,
    },
    create: {
      name,
      keyHash,
      tokenHash,
      userId: user.id,
      isActive: true,
      expiresAt,
    },
  });

  console.log('API credential seeded successfully');
  console.log(`credentialId=${credential.id}`);
  console.log(`user=${user.username}`);
  console.log(`name=${credential.name ?? ''}`);
  console.log(`apiKey=${plainKey}`);
  console.log(`apiToken=${plainToken}`);
  console.log(`expiresAt=${credential.expiresAt?.toISOString() ?? 'never'}`);
}

//main()
//  .catch((error) => {
//    console.error(error);
//    process.exit(1);
//  })
//  .finally(async () => {
//    await prisma.$disconnect();
//  });

(async () => {
  try {
    await main()
  } catch (error) {
    console.log(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
