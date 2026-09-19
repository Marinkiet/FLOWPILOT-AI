import { randomBytes } from 'crypto';

/**
 * Generate a short, prefixed, URL-safe ID.
 * e.g. generateId('step') → 'step_a1b2c3d4'
 */
export function generateId(prefix: string): string {
  const rand = randomBytes(4).toString('hex');
  return `${prefix}_${rand}`;
}
