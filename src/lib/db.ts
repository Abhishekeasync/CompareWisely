import { Prisma, PrismaClient } from "@prisma/client";

/** True during `next build` static analysis / prerender collection. */
export function isProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1002" || error.code === "P1003";
  }
  return false;
}

/**
 * Runs a query for `generateStaticParams`. When the DB is down during `next build`,
 * returns `unavailable` instead of failing the build (routes render on demand at runtime).
 */
export async function queryStaticParamsSlugs<T>(
  query: () => Promise<T[]>,
): Promise<T[] | "unavailable"> {
  try {
    return await query();
  } catch (error) {
    if (isProductionBuildPhase() && isDatabaseUnavailableError(error)) {
      console.warn(
        "[comparewisely] Database unreachable during build; skipping static paths for this segment. Run `docker compose up -d` and `npm run db:push && npm run db:seed` to pre-render all routes.",
      );
      return "unavailable";
    }
    throw error;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaShutdownHookRegistered?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // In production, register process signal handlers once for graceful connection drain
  if (!globalForPrisma.prismaShutdownHookRegistered && typeof process !== "undefined") {
    globalForPrisma.prismaShutdownHookRegistered = true;

    const handleShutdown = async (signal: string) => {
      try {
        await prisma.$disconnect();
      } catch (err) {
        console.error(`Error disconnecting Prisma on ${signal}:`, err);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  }
}

export default prisma;
