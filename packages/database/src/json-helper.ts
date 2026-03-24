import type { Prisma } from '@prisma/client';

/**
 * Prisma's InputJsonValue type is very strict.
 * This helper casts Record<string, unknown> to the correct Prisma JSON input type.
 * Use: `toJsonInput(myObject)` anywhere you write JSON to Prisma.
 */
export function toJsonInput(value: Record<string, unknown> | unknown[] | null): Prisma.InputJsonValue | undefined {
  return value as unknown as Prisma.InputJsonValue;
}
