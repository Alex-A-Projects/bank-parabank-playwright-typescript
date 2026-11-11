import fs from 'fs';
import path from 'path';
import { Paths } from './paths';

/**
 * Environment resolution for the ParaBank suite.
 *
 * The suite has TWO INDEPENDENT env axes, adapted from the reference
 * implementation:
 *
 *   - **Suite env** (`TEST_ENV`) — drives where the browser navigates
 *     and which database the DB suite connects to.
 *   - **Server/API env** (`API_ENV`) — selects the backend that the API
 *     clients and API fixtures talk to. It never affects browser
 *     navigation.
 *
 * The two may legitimately differ within a single run (for example
 * `TEST_ENV=local` with `API_ENV=cloud`). That is intentional, not a
 * bug.
 *
 * NO SECRETS IN CODE. Every credential, connection string and URL is read
 * from `process.env`; nothing here carries a fallback value for one. A
 * missing variable is a loud failure, not a silent default.
 */

// ---------------------------------------------------------------------------
// .env loading
// ---------------------------------------------------------------------------

/**
 * Loads `<repoRoot>/.env` into `process.env` without overwriting values
 * that are already set. Real environment variables (CI, docker-compose,
 * the shell) always win over the file.
 */
function loadDotEnv(): void {
  if (!fs.existsSync(Paths.rootEnvFile)) {
    return;
  }

  const contents = fs.readFileSync(Paths.rootEnvFile, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const separator = line.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key !== '' && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

// ---------------------------------------------------------------------------
// Required variables
// ---------------------------------------------------------------------------

/**
 * Reads a variable that the suite cannot work without.
 *
 * An unset variable throws with a message that points at `.env.example`,
 * so a missing key is obvious on the first run instead of showing up as
 * a confusing authentication or connection error later.
 *
 * An empty string is a legitimate value (an empty database password, for
 * example) and is returned as-is.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Copy .env.example to .env and fill it in - every credential, ' +
        'connection string and URL the suite uses comes from the environment.',
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

/** Environments the suite can target. */
export type TestEnv = 'cloud' | 'local';

const KNOWN_ENVS: readonly TestEnv[] = ['cloud', 'local'];

function isTestEnv(value: string): value is TestEnv {
  return (KNOWN_ENVS as readonly string[]).includes(value);
}

const RAW_TEST_ENV = (process.env.TEST_ENV ?? 'cloud').toLowerCase();
if (!isTestEnv(RAW_TEST_ENV)) {
  throw new Error(
    `Unknown TEST_ENV="${RAW_TEST_ENV}". Valid options: ${KNOWN_ENVS.join(', ')}.`,
  );
}

const RAW_API_ENV = (process.env.API_ENV ?? RAW_TEST_ENV).toLowerCase();
if (!isTestEnv(RAW_API_ENV)) {
  throw new Error(
    `Unknown API_ENV="${RAW_API_ENV}". Valid options: ${KNOWN_ENVS.join(', ')}.`,
  );
}

/** The suite environment — navigation and database target. */
export const TEST_ENV: TestEnv = RAW_TEST_ENV;

/** The server/API environment — API clients and API fixtures only. */
export const API_ENV: TestEnv = RAW_API_ENV;

/**
 * The name of the variable that holds an environment's base URL.
 *
 * The two axes are independent, so a run may target the cloud demo, the
 * local container, or both. Each environment's URL is therefore read
 * only when that environment is actually the one being addressed.
 */
function baseUrlVariable(envName: TestEnv): 'CLOUD_BASE_URL' | 'LOCAL_BASE_URL' {
  return envName === 'cloud' ? 'CLOUD_BASE_URL' : 'LOCAL_BASE_URL';
}

/**
 * The base URL of an environment.
 *
 * The variable is read at the moment the environment is addressed, not
 * at module load: a run that only ever talks to the local container
 * must not be forced to configure the public demo's URL, and a run that
 * only talks to the demo must not be forced to configure the local
 * one. A variable that IS needed and is missing still fails loudly.
 */
export function baseUrlFor(envName: TestEnv): string {
  return requireEnv(baseUrlVariable(envName)).replace(/\/+$/, '');
}

/** The base URL of the public cloud demo. */
export function cloudBaseUrl(): string {
  return baseUrlFor('cloud');
}

/** The base URL of the local ParaBank instance. */
export function localBaseUrl(): string {
  return baseUrlFor('local');
}

/** Base URL the browser navigates to (driven by `TEST_ENV`). */
export const baseURL = baseUrlFor(TEST_ENV);

/** Base URL the API clients call (driven by `API_ENV`). */
export const apiBaseURL = baseUrlFor(API_ENV);

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

/**
 * JDBC coordinates for the embedded HSQLDB.
 *
 * ParaBank runs HSQLDB inside the app container and exposes it over
 * TCP on port 9001. Only the `local` environment has a reachable
 * database — the public cloud demo does not expose its HSQLDB port, which
 * is why every `db-*` feature is disabled for `cloud` in
 * `config/test-policy.json`.
 */
export const dbConfig = {
  /** JDBC URL of the ParaBank HSQLDB instance. */
  get jdbcUrl(): string {
    return requireEnv('DB_JDBC_URL');
  },
  /** Database user. */
  get user(): string {
    return requireEnv('DB_USER');
  },
  /** Database password. May be empty. */
  get password(): string {
    return requireEnv('DB_PASSWORD');
  },
} as const;

/**
 * Base URL of the app instance that owns the database above.
 *
 * The database lives inside the local container, so the DB suite always
 * drives the local app — independently of `TEST_ENV`. The DB suite is
 * gated to the local environment through `config/test-policy.json`
 * (`db-*` features are disabled for `cloud`), so a cloud run never
 * reaches this point.
 */
export const dbAppBaseURL = baseUrlFor('local');

// ---------------------------------------------------------------------------
// Demo credentials
// ---------------------------------------------------------------------------

/**
 * ParaBank's seeded demo customer.
 *
 * The credentials come from the environment. Note that ParaBank does
 * NOT create a customer on the fly: an unknown username is answered with
 * "Invalid username and/or password", so the seeded account has to be
 * used for the read-only scenarios.
 */
export const demoCustomer = {
  get username(): string {
    return requireEnv('DEMO_USERNAME');
  },
  get password(): string {
    return requireEnv('DEMO_PASSWORD');
  },
} as const;

export const env = {
  testEnv: TEST_ENV,
  apiEnv: API_ENV,
  baseURL,
  apiBaseURL,
  dbAppBaseURL,
  dbConfig,
  demoCustomer,
} as const;

/**
 * True when the two axes point at different backends. Used by the
 * startup banner so a mismatched run is visible rather than surprising.
 */
export function envAxesDiffer(): boolean {
  return TEST_ENV !== API_ENV;
}

/** Absolute path to a file inside the repository. */
export function repoPath(...segments: string[]): string {
  return path.join(Paths.repoRoot, ...segments);
}
