/**
 * Prisma Client Instance
 * Singleton pattern for database connections
 * Integrates with PostgreSQL
 * 
 * Prisma v7 Pattern: Requires driver adapter
 * Single Source of Truth: All Prisma imports should come from this file
 */
import "dotenv/config"
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './prisma/client'

// Initialize driver adapter (required in Prisma v7)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

// Singleton pattern for Node.js (prevents multiple instances in dev mode)
const globalForPrisma = globalThis as unknown as {
  prisma: any
}

import { getCooperativeId } from './contextStore';

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: { model: string, operation: string, args: any, query: (args: any) => Promise<any> }) {
        const coopId = getCooperativeId();
        if (coopId) {
          const modelsToScope = ['User', 'Biodata', 'Savings', 'Shares', 'Loan', 'Request', 'Transaction'];
          
          if (modelsToScope.includes(model)) {
            // 1. Scope queries by cooperativeId for read/update/delete operations
            if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              (args as any).where = (args as any).where || {};
              (args as any).where.cooperativeId = coopId;
            }
            // 2. Inject cooperativeId for create operations
            else if (operation === 'create') {
              (args as any).data = (args as any).data || {};
              (args as any).data.cooperativeId = coopId;
            }
            // 3. Inject cooperativeId for createMany operations
            else if (operation === 'createMany') {
              if (Array.isArray((args as any).data)) {
                (args as any).data = (args as any).data.map((item: any) => ({
                  ...item,
                  cooperativeId: coopId
                }));
              } else if ((args as any).data) {
                (args as any).data.cooperativeId = coopId;
              }
            }
            // 4. Inject cooperativeId for upsert operations
            else if (operation === 'upsert') {
              (args as any).create = (args as any).create || {};
              (args as any).create.cooperativeId = coopId;
              (args as any).update = (args as any).update || {};
              (args as any).update.cooperativeId = coopId;
              (args as any).where = (args as any).where || {};
              (args as any).where.cooperativeId = coopId;
            }
          }
        }
        return query(args);
      }
    }
  }
});

// Optional test-only instrumentation: increment an in-memory counter for every Prisma query
// Enabled when PRISMA_CAPTURE_QUERIES_FOR_TEST === 'true' (dev/test only)
if (process.env.PRISMA_CAPTURE_QUERIES_FOR_TEST === 'true') {
  // initialize counter
  (globalThis as any).__prismaTestQueryCount = 0;
  // Use prisma.$on('query') to count executed queries (works with `log: ['query']`)
  (prisma as any).$on('query', () => {
    try {
      (globalThis as any).__prismaTestQueryCount = ((globalThis as any).__prismaTestQueryCount || 0) + 1;
    } catch (_) {
      /* ignore */
    }
  });
}

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ✨ SINGLE SOURCE OF TRUTH: Re-export all Prisma types, enums, and utilities
export * from './prisma/client'

// Optional: Explicit exports for better IDE discoverability
export {
  Prisma,
} from './prisma/client'

export { Decimal } from 'decimal.js'

export default prisma
