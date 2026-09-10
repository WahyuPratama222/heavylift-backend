export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return null;
}

export function convertDecimals<T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[],
): T {
  const result = { ...obj };
  for (const key of keys) {
    if (result[key] !== null && result[key] !== undefined) {
      result[key] = toNumber(result[key]) as T[keyof T];
    }
  }
  return result;
}
