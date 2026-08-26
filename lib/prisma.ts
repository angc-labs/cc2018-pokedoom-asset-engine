import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const fallbackUrl = process.env.DATABASE_URL || 'file:./local.db';

  if (tursoUrl && authToken) {
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: authToken,
    });
    return new PrismaClient({ adapter } as any);
  }

  // Local fallback
  const adapter = new PrismaLibSql({
    url: fallbackUrl,
  });
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
