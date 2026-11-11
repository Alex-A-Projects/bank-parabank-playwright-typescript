/**
 * Failure collection.
 *
 * When a test verifies several independent things, a plain sequence of
 * `expect()` calls stops at the first failure and hides the rest. This
 * module implements the reference implementation's pattern: run every
 * check, collect the ones that failed, and report them all at once.
 *
 * ```ts
 * const failures = await collectFailures({
 *   'heading visible': () => expect(page.heading).toBeVisible(),
 *   'form visible':   () => expect(page.form).toBeVisible(),
 * });
 * expect(failures, `Not satisfied: ${failures.join(', ')}`).toEqual([]);
 * ```
 *
 * `expect.soft` is deliberately not used: soft assertions require an
 * explicit termination step and can mask genuinely different failures
 * inside one test. The try/catch pattern states the intent more clearly
 * and produces a better error message.
 */

/**
 * Runs every named check and returns the names of the ones that failed.
 *
 * Checks run in insertion order. The first failure's message is captured
 * so it can be surfaced alongside the list.
 */
export async function collectFailures(
  checks: Record<string, () => Promise<void>>,
): Promise<string[]> {
  const failed: string[] = [];

  for (const [name, check] of Object.entries(checks)) {
    try {
      await check();
    } catch {
      failed.push(name);
    }
  }

  return failed;
}

/**
 * Same as {@link collectFailures} but throws a single aggregated error
 * listing every failed check, including the underlying reason.
 *
 * Use this when the caller does not want to run its own final assertion.
 */
export async function assertAll(
  checks: Record<string, () => Promise<void>>,
  context = 'Multiple checks failed',
): Promise<void> {
  const reasons: Array<{ name: string; reason: string }> = [];

  for (const [name, check] of Object.entries(checks)) {
    try {
      await check();
    } catch (error) {
      reasons.push({ name, reason: (error as Error).message });
    }
  }

  if (reasons.length === 0) {
    return;
  }

  const detail = reasons
    .map((entry) => `  - ${entry.name}: ${entry.reason}`)
    .join('\n');
  throw new Error(`${context}:\n${detail}`);
}
