import { Prisma } from '@prisma/client';

export function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

export function convertDecimals<T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[],
): T {
  const result = { ...obj };
  for (const key of keys) {
    if (result[key] !== null && result[key] !== undefined) {
      result[key] = toNumber(result[key] as any) as any;
    }
  }
  return result;
}