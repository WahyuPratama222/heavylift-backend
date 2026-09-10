import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generic Interface for Prisma Model Delegates.
 * Uses a flexible function signature to support all auto-generated Prisma delegates
 * without triggering contravariant generic parameter type conflicts.
 */
export interface PrismaModelDelegate {
  findMany(args?: any): any;
  count(args?: any): any;
}

export async function paginate<T>(
  prisma: PrismaService,
  model: PrismaModelDelegate,
  args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    select?: Record<string, unknown>;
    include?: Record<string, unknown>;
  },
  query: { page?: number; limit?: number },
  defaultLimit = 10,
): Promise<{
  data: T[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> {
  const page = query.page ?? 1;
  const limit = query.limit ?? defaultLimit;
  const skip = (page - 1) * limit;

  const [data, total] = (await (prisma.$transaction as any)([
    model.findMany({ ...args, skip, take: limit }),
    model.count({ where: args.where }),
  ])) as [T[], number];

  return {
    data,
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}
