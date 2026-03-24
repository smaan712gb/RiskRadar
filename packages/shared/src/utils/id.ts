import { randomBytes } from 'node:crypto';

/**
 * Generate a compact, URL-safe unique ID.
 * Uses crypto.randomBytes for security — no external dependency needed.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('base64url').slice(0, 12);
  return `${timestamp}${random}`;
}

export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 10 && id.length <= 30;
}
