/**
 * Date helpers.
 *
 * ParaBank's transaction date format is `MM-DD-YYYY` (the US demo
 * default), and several API operations are date-scoped. These helpers
 * keep that format in one place instead of scattering string templates
 * through specs.
 */

/** `MM-dd-yyyy` — the format ParaBank's transaction tables display. */
export function formatParaBankDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}-${date.getFullYear()}`;
}

/** `yyyy-MM-dd` — ISO, used for logs and reporting metadata. */
export function formatIsoDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** ISO-8601 timestamp with milliseconds — used for unique-value salts. */
export function timestamp(): string {
  return new Date().toISOString();
}

/** `Date` shifted by `days`, preserving the wall-clock time of day. */
export function addDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}
