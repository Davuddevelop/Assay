/**
 * Detect how to run a repo's tests from its root files. Pure and testable —
 * the sandbox runner uses the result to install deps and run the suite.
 */
export interface TestPlan {
  runner: "node" | "python" | "go" | "rust";
  installCommand: string | null;
  testCommand: string;
}

export interface RepoManifest {
  /** File names present at the repo root. */
  rootFiles: string[];
  /** Raw package.json contents, if any. */
  packageJson?: string;
}

function nodeInstall(rootFiles: string[]): string {
  if (rootFiles.includes("pnpm-lock.yaml")) return "corepack pnpm install --frozen-lockfile";
  if (rootFiles.includes("yarn.lock")) return "corepack yarn install --frozen-lockfile";
  if (rootFiles.includes("package-lock.json")) return "npm ci";
  return "npm install";
}

function nodeRun(rootFiles: string[]): string {
  if (rootFiles.includes("pnpm-lock.yaml")) return "pnpm test";
  if (rootFiles.includes("yarn.lock")) return "yarn test";
  return "npm test --silent";
}

/** Returns a runnable test plan, or null if no test setup is recognized. */
export function detectTestPlan(manifest: RepoManifest): TestPlan | null {
  const { rootFiles, packageJson } = manifest;

  // Node: only if a real (non-placeholder) test script exists.
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson) as { scripts?: Record<string, string> };
      const test = pkg.scripts?.test?.trim();
      if (test && !/no test specified/i.test(test)) {
        return {
          runner: "node",
          installCommand: nodeInstall(rootFiles),
          testCommand: nodeRun(rootFiles),
        };
      }
    } catch {
      // malformed package.json — fall through to other ecosystems
    }
  }

  if (rootFiles.includes("go.mod")) {
    return { runner: "go", installCommand: null, testCommand: "go test ./..." };
  }

  if (
    rootFiles.some((f) =>
      ["pytest.ini", "pyproject.toml", "setup.py", "requirements.txt", "tox.ini"].includes(f),
    )
  ) {
    const install = rootFiles.includes("requirements.txt")
      ? "pip install -r requirements.txt"
      : "pip install -e . || true";
    return { runner: "python", installCommand: install, testCommand: "pytest -q" };
  }

  if (rootFiles.includes("Cargo.toml")) {
    return { runner: "rust", installCommand: null, testCommand: "cargo test" };
  }

  return null;
}
