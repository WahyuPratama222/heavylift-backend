import { PrismaService } from '../../prisma/prisma.service';

export async function paginate<T>(
  prisma: PrismaService,
  model: any,
  args: { where?: any; orderBy?: any; select?: any; include?: any },
  query: { page?: number; limit?: number },
  defaultLimit = 10,
): Promise<{ data: T[]; meta: { total: number; page: number; limit: number; total_pages: number } }> {
  const page = query.page ?? 1;
  const limit = query.limit ?? defaultLimit;
  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    model.findMany({ ...args, skip, take: limit }),
    model.count({ where: args.where }),
  ]);

  return {
    data: data as T[],
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
}