/**
 * Tag vocabulary for the ParaBank suite.
 *
 * Two independent, composable axes:
 *
 *   1. **Selection tags** — the `Tags` constants below. Purely for
 *      choosing which tests to run (`--grep @smoke`). They never gate
 *      execution.
 *   2. **Feature tags** — produced by `featureTag('login')`. These are
 *      matched against `config/test-policy.json`: a test tagged for a
 *      disabled feature is skipped, a test tagged with an unknown
 *      feature fails loudly.
 *
 * There is one exception to the first rule: `@mutating` is a marker,
 * not a selection. It says "this test changes data", and such a test
 * only ever runs against the local container — the shared public demo
 * belongs to everybody. See `mutatingTestSkipReason()` in
 * `src/shared/policy.ts`.
 *
 * Tags are applied with Playwright's `test()` / `describe()` `tag`
 * option, e.g. `test('...', { tag: [Tags.SMOKE, featureTag('login')] }, ...)`.
 */

/** Selection tags — chosen at the CLI, never gate execution. */
export const Tags = {
  SMOKE: '@smoke',
  SANITY: '@sanity',
  REGRESSION: '@regression',
  NEGATIVE: '@negative',
  BOUNDARY: '@boundary',
  E2E: '@e2e',
  SECURITY: '@security',
  ACCESSIBILITY: '@accessibility',
  CRITICAL: '@critical',

  /**
   * Marker tag: this test changes data in the application.
   *
   * A mutating test only runs against the local container. The public
   * cloud demo is shared by everybody who points a browser at it, so
   * writing to it would change someone else's data.
   */
  MUTATING: '@mutating',
} as const;

export type Tag = (typeof Tags)[keyof typeof Tags];

/** Prefix used by every feature tag. */
export const FEATURE_TAG_PREFIX = '@feature:';

/**
 * Builds a feature tag from a feature name.
 *
 * @example featureTag('login') // '@feature:login'
 */
export function featureTag(feature: string): string {
  if (!feature || feature.trim() === '') {
    throw new Error('featureTag() requires a non-empty feature name.');
  }
  return `${FEATURE_TAG_PREFIX}${feature.trim()}`;
}

/** True when the given tag is a feature tag. */
export function isFeatureTag(tag: string): boolean {
  return tag.startsWith(FEATURE_TAG_PREFIX);
}

/** Extracts the feature name from a feature tag; throws for other tags. */
export function featureNameFromTag(tag: string): string {
  if (!isFeatureTag(tag)) {
    throw new Error(`"${tag}" is not a feature tag.`);
  }
  return tag.slice(FEATURE_TAG_PREFIX.length);
}

const KNOWN_SELECTION_TAGS: ReadonlySet<string> = new Set(Object.values(Tags));

/**
 * Validates every tag on a test. Acts as Playwright's `--strict-markers`
 * equivalent: a typo fails the test loudly instead of silently producing a
 * tag that no `--grep` will ever match.
 *
 * Feature tags are validated separately against the policy matrix by
 * `src/shared/policy.ts` — that module owns the list of known features.
 */
export function assertKnownTags(tags: readonly string[]): void {
  for (const tag of tags) {
    if (isFeatureTag(tag)) {
      continue; // validated against the policy matrix, not this list
    }
    if (!KNOWN_SELECTION_TAGS.has(tag)) {
      throw new Error(
        `Unknown tag "${tag}". Use the constants from Tags (src/shared/tags.ts) ` +
          'or featureTag() from the same module; add a new constant there if ' +
          'the tag is genuinely new.',
      );
    }
  }
}
