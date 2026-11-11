import fs from 'fs';
import { Paths } from './paths';
import { featureNameFromTag, isFeatureTag, Tags } from './tags';
import type { TestEnv } from './env';

/**
 * Feature gating.
 *
 * `config/test-policy.json` is a hand-maintained matrix of
 * `env -> feature -> enabled`. It is the single source of truth for which
 * features exist and where they run.
 *
 * Two failure modes are deliberately distinguished:
 *
 *   - A test tagged for a feature that is **disabled** in the current
 *     environment is **skipped**, with the reason recorded.
 *   - A test tagged with a feature that is **unknown** (not present in
 *     the matrix at all) **fails loudly**. A typo must never turn into
 *     a test that silently never runs.
 *
 * On top of the matrix there is one rule that does not belong in a
 * matrix, because it is about what a test DOES rather than which
 * feature it covers: a test that changes data runs against the local
 * container only. The public cloud demo is shared by everybody, so
 * writing to it would change somebody else's data.
 */

interface PolicyFile {
  envs: Record<string, { features: Record<string, boolean> }>;
}

function loadPolicy(): PolicyFile {
  if (!fs.existsSync(Paths.testPolicyFile)) {
    throw new Error(
      `Feature policy file not found at ${Paths.testPolicyFile}. ` +
        'The suite cannot decide which features to run without it.',
    );
  }
  const parsed = JSON.parse(fs.readFileSync(Paths.testPolicyFile, 'utf8')) as PolicyFile;
  if (!parsed.envs || typeof parsed.envs !== 'object') {
    throw new Error(
      `${Paths.testPolicyFile} is malformed: expected a top-level "envs" object.`,
    );
  }
  return parsed;
}

const policy = loadPolicy();

/** Every environment the policy matrix describes. */
export const knownEnvs: string[] = Object.keys(policy.envs);

/** Every feature known to the matrix, across all environments. */
export const knownFeatures: string[] = Array.from(
  new Set(
    Object.values(policy.envs).flatMap((entry) => Object.keys(entry.features)),
  ),
).sort();

/**
 * Decides whether a feature is enabled in an environment.
 *
 * @returns `true` / `false` when the feature is known, `null` when the
 *          feature does not exist in the matrix at all.
 */
export function isFeatureEnabled(feature: string, envName: string): boolean | null {
  const entry = policy.envs[envName];
  if (!entry) {
    throw new Error(
      `Unknown environment "${envName}" in ${Paths.testPolicyFile}. ` +
        `Known environments: ${knownEnvs.join(', ')}.`,
    );
  }
  const value = entry.features[feature];
  return value === undefined ? null : value;
}

/**
 * The skip reason for a test tagged with the given feature tags in the
 * given environment.
 *
 * @returns `null` when every tagged feature is enabled.
 * @throws when a tagged feature is not present in the matrix — an
 *         unknown feature is a defect in the test, not a skip.
 */
export function featureGateSkipReason(
  featureTags: readonly string[],
  envName: string,
): string | null {
  for (const tag of featureTags) {
    if (!isFeatureTag(tag)) {
      continue;
    }
    const feature = featureNameFromTag(tag);
    const enabled = isFeatureEnabled(feature, envName);

    if (enabled === null) {
      throw new Error(
        `Unknown feature "${feature}" (from tag "${tag}"). ` +
          `Add it to config/test-policy.json under the "${envName}" environment ` +
          `before using it in a test. Known features: ${knownFeatures.join(', ')}.`,
      );
    }

    if (!enabled) {
      return `feature "${feature}" is disabled in environment "${envName}"`;
    }
  }
  return null;
}

/**
 * The reason a test that changes data must not run against this
 * environment.
 *
 * A test tagged `@mutating` writes to the application: it registers a
 * customer, opens an account, moves money, pays a bill or resets the
 * database. Such a test only runs against the local container. The
 * public cloud demo is shared by everybody who points a browser at it,
 * so a write there would change somebody else's data.
 *
 * @returns `null` when the test may run.
 */
export function mutatingTestSkipReason(
  tags: readonly string[],
  envName: TestEnv,
): string | null {
  if (!tags.includes(Tags.MUTATING)) {
    return null;
  }
  if (envName === 'local') {
    return null;
  }
  return (
    `mutating tests run against the local container only - ` +
    `environment "${envName}" is shared`
  );
}
