import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { Paths } from '../../shared/paths';
import { dbConfig } from '../../shared/env';

const execFileAsync = promisify(execFile);

/** How long a single query may take before it is treated as failed. */
const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * DbClient - the bridge to ParaBank's HSQLDB.
 *
 * The suite talks to the database through a small Java helper
 * (`jdbc/DbQuery.java`) that is compiled on demand and executed as a
 * child process. Node has no JDBC driver, and shipping a native one
 * would add a platform-specific dependency for a read-only use case.
 *
 * The connection details travel through the child's environment, never
 * through a command-line argument, so they cannot leak into a process
 * listing.
 *
 * ZERO ASSERTIONS. The client reports what the database said.
 */
export class DbClient {
  private compiled = false;

  /** The classpath the helper is executed with. */
  get classpath(): string {
    return `${Paths.jdbcDriver}${pathSeparator()}${Paths.jdbcDir}`;
  }

  /**
   * Run one query mode and return its raw stdout.
   *
   * An empty string means "no rows".
   */
  async exec(mode: string, args: string[] = [], timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
    await this.ensureCompiled();

    try {
      const { stdout } = await execFileAsync(
        'java',
        ['-cp', this.classpath, 'DbQuery', mode, ...args],
        {
          timeout: timeoutMs,
          env: {
            ...process.env,
            DB_JDBC_URL: dbConfig.jdbcUrl,
            DB_USER: dbConfig.user,
            DB_PASSWORD: dbConfig.password,
          },
        },
      );
      return stdout;
    } catch (error) {
      throw new Error(
        `Database query "${mode}" failed: ${describe(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * Compile the helper if the class file is missing or older than the
   * source.
   *
   * Compiling on demand keeps the repository free of a build step while
   * still making an edited helper take effect immediately.
   */
  private async ensureCompiled(): Promise<void> {
    if (this.compiled) {
      return;
    }
    if (!fs.existsSync(Paths.jdbcDriver)) {
      throw new Error(
        `The HSQLDB JDBC driver is missing at ${Paths.jdbcDriver}. ` +
          'It is part of the repository; re-checkout the project.',
      );
    }
    if (!isUpToDate(Paths.jdbcSource, Paths.jdbcClass)) {
      await compile();
    }
    this.compiled = true;
  }
}

/** The platform's path separator. */
function pathSeparator(): string {
  return process.platform === 'win32' ? ';' : ':';
}

/** True when `target` exists and is at least as new as `source`. */
function isUpToDate(source: string, target: string): boolean {
  if (!fs.existsSync(target)) {
    return false;
  }
  if (!fs.existsSync(source)) {
    return true;
  }
  return fs.statSync(target).mtimeMs >= fs.statSync(source).mtimeMs;
}

/** Compile the Java helper into its own directory. */
async function compile(): Promise<void> {
  try {
    await execFileAsync(
      'javac',
      ['-cp', Paths.jdbcDriver, '-d', Paths.jdbcDir, Paths.jdbcSource],
      { timeout: DEFAULT_TIMEOUT_MS },
    );
  } catch (error) {
    throw new Error(
      `Could not compile ${Paths.jdbcSource}: ${describe(error)}. ` +
        'A JDK (javac) must be on the PATH for the database suite to run.',
      { cause: error },
    );
  }
}

/** A readable description of a failed child process. */
function describe(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const failure = error as { stderr?: string; message?: string };
    const stderr = failure.stderr?.trim();
    if (stderr) {
      return stderr;
    }
    if (failure.message) {
      return failure.message;
    }
  }
  return String(error);
}
