import { randomBytes } from 'crypto';

/**
 * Test-data generators.
 *
 * The one hard constraint worth encoding here: **ParaBank silently
 * truncates usernames to roughly 20 characters.** Two generated usernames
 * that share a long prefix would therefore collide, and the second
 * registration would fail with "user already exists" for no visible
 * reason. Every generator below therefore keeps the total length inside
 * that limit.
 */

/** ParaBank's effective username length ceiling. */
export const MAX_USERNAME_LENGTH = 20;

/**
 * Short, collision-resistant random suffix.
 *
 * 8 hex characters is 32 bits of entropy — ample for a test suite that
 * creates a handful of customers per run, while keeping usernames short
 * enough to stay under `MAX_USERNAME_LENGTH`.
 */
export function randomSuffix(bytes = 4): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * A username that is unique per call and inside ParaBank's length limit.
 *
 * @param prefix readable prefix, e.g. `'qa'`
 */
export function uniqueUsername(prefix = 'qa'): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'qa';
  const candidate = `${safePrefix}_${randomSuffix()}`;
  if (candidate.length > MAX_USERNAME_LENGTH) {
    throw new Error(
      `Generated username "${candidate}" exceeds the ${MAX_USERNAME_LENGTH}-character limit.`,
    );
  }
  return candidate;
}

/** A generated SSN. ParaBank does not validate the checksum. */
export function randomSsn(): string {
  return String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
}

/** A generated phone number in the format ParaBank's form accepts. */
export function randomPhone(): string {
  return String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
}

/** A generated street address. */
export function randomStreet(): string {
  return `${Math.floor(Math.random() * 9999) + 1} Automation Lane`;
}

/** A generated postal code. */
export function randomZip(): string {
  return String(Math.floor(Math.random() * 90000) + 10000);
}

/** A generated city name. */
export function randomCity(): string {
  const cities = ['Springfield', 'Riverton', 'Fairview', 'Georgetown', 'Salem'];
  return cities[Math.floor(Math.random() * cities.length)];
}

/** A generated state code. */
export function randomState(): string {
  const states = ['CA', 'NY', 'TX', 'IL', 'WA', 'MA', 'CO', 'OR'];
  return states[Math.floor(Math.random() * states.length)];
}
