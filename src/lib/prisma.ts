import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton for Next.js
 * In development, Next.js clears Node.js cache on hot-reload, which can cause
 * new PrismaClient instances to be created on every change.
 * Attaching to globalThis ensures a single connection pool is shared.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
