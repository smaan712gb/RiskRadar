import { createId, isCuid } from '@paralleldrive/cuid2';

export function generateId(): string {
  return createId();
}

export function isValidId(id: string): boolean {
  return isCuid(id);
}
