import fs from 'fs';
import path from 'path';

/**
 * Resolves the repository root by walking up until a `.git` directory is
 * found. `PROJECT_ROOT` overrides the search — useful when the suite is
 * executed from a directory that is not inside the checkout (CI caches,
 * Docker mounts, symlinked workspaces).
 */
function findRepoRoot(startDir: string): string {
  if (process.env.PROJECT_ROOT) {
    return path.resolve(process.env.PROJECT_ROOT);
  }

  let current = startDir;
  for (;;) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(
        'Could not locate the repo root (no .git directory found above ' +
          `${startDir}). Set PROJECT_ROOT to point at the checkout.`,
      );
    }
    current = parent;
  }
}

const repoRoot = findRepoRoot(__dirname);

/**
 * Every filesystem path the suite touches resolves through this module.
 * No literal paths in page objects, clients or repositories.
 */
export const Paths = {
  repoRoot,
  rootEnvFile: path.join(repoRoot, '.env'),
  testPolicyFile: path.join(repoRoot, 'config', 'test-policy.json'),
  jdbcDir: path.join(repoRoot, 'src', 'db', 'client', 'jdbc'),
  jdbcDriver: path.join(repoRoot, 'src', 'db', 'client', 'jdbc', 'hsqldb-2.7.4.jar'),
  jdbcSource: path.join(repoRoot, 'src', 'db', 'client', 'jdbc', 'DbQuery.java'),
  jdbcClass: path.join(repoRoot, 'src', 'db', 'client', 'jdbc', 'DbQuery.class'),
} as const;
