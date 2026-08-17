import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BIN = join(REPO_ROOT, "bin", "tasks");

const scratch: string[] = [];

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  scratch.push(dir);
  return dir;
}

function writeExecutable(path: string, body: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  chmodSync(path, 0o755);
}

// A checkout shaped just enough for bin/tasks: a lockfile, a scripts/cli.ts to
// exec, and optionally an installed toolchain.
function fakeCheckout(opts: { installed: boolean; stampOlderThanLock?: boolean }): {
  dir: string;
  ranLog: string;
} {
  const dir = tempDir("bin-tasks-checkout-");
  const ranLog = join(dir, "cli-ran.txt");
  writeFileSync(join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  writeExecutable(join(dir, "scripts", "cli.ts"), `echo ran > ${JSON.stringify(ranLog)}\n`);

  if (opts.installed) {
    writeExecutable(
      join(dir, "node_modules", ".bin", "tsx"),
      `#!/usr/bin/env bash\necho "tsx $*" > ${JSON.stringify(ranLog)}\n`,
    );
    const stamp = join(dir, "node_modules", ".modules.yaml");
    writeFileSync(stamp, "hoistPattern: []\n");
    if (opts.stampOlderThanLock) {
      const old = new Date(Date.now() - 60_000);
      utimesSync(stamp, old, old);
    }
  }
  return { dir, ranLog };
}

// Stands in for pnpm: records that it was called, and materializes the
// toolchain the way a real install would.
function fakePnpm(installTarget: string | null): { dir: string; log: string } {
  const dir = tempDir("bin-tasks-pnpm-");
  const log = join(dir, "pnpm-calls.txt");
  const install =
    installTarget === null
      ? ""
      : `mkdir -p ${JSON.stringify(join(installTarget, "node_modules", ".bin"))}\n` +
        `printf '#!/usr/bin/env bash\\necho "tsx $*" > %s\\n' ${JSON.stringify(join(installTarget, "cli-ran.txt"))} > ${JSON.stringify(join(installTarget, "node_modules", ".bin", "tsx"))}\n` +
        `chmod +x ${JSON.stringify(join(installTarget, "node_modules", ".bin", "tsx"))}\n` +
        `echo 'hoistPattern: []' > ${JSON.stringify(join(installTarget, "node_modules", ".modules.yaml"))}\n`;
  writeExecutable(
    join(dir, "pnpm"),
    `#!/usr/bin/env bash\necho "$*" >> ${JSON.stringify(log)}\necho "pnpm noise on stdout"\n${install}`,
  );
  return { dir, log };
}

function runBin(cwd: string, tasksDir: string, pnpmDir: string) {
  return spawnSync(BIN, ["ready"], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      TASKS_DIR: tasksDir,
      RFCS_DIR: undefined,
      PATH: `${pnpmDir}:${process.env.PATH ?? ""}`,
    },
  });
}

afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("bin/tasks toolchain bootstrap", () => {
  it("does not shell out to pnpm when the toolchain is present and current", () => {
    const { dir, ranLog } = fakeCheckout({ installed: true });
    const pnpm = fakePnpm(null);

    const run = runBin(dir, dir, pnpm.dir);

    expect(run.status).toBe(0);
    expect(existsSync(pnpm.log)).toBe(false);
    expect(readFileSync(ranLog, "utf8")).toContain("tsx");
  });

  it("installs and proceeds when tsx is missing", () => {
    const { dir, ranLog } = fakeCheckout({ installed: false });
    const pnpm = fakePnpm(dir);

    const run = runBin(dir, dir, pnpm.dir);

    expect(run.status).toBe(0);
    expect(readFileSync(pnpm.log, "utf8")).toContain(`install --dir ${dir} --silent`);
    expect(readFileSync(ranLog, "utf8")).toContain("tsx");
  });

  it("installs when the install stamp predates the lockfile", () => {
    const { dir } = fakeCheckout({ installed: true, stampOlderThanLock: true });
    const pnpm = fakePnpm(dir);

    expect(runBin(dir, dir, pnpm.dir).status).toBe(0);
    expect(readFileSync(pnpm.log, "utf8")).toContain("install --dir");
  });

  it("keeps pnpm's chatter off stdout so --json output stays parseable", () => {
    const { dir } = fakeCheckout({ installed: false });
    const pnpm = fakePnpm(dir);

    const run = runBin(dir, dir, pnpm.dir);

    expect(run.stdout).not.toContain("pnpm noise on stdout");
    expect(run.stderr).toContain("pnpm noise on stdout");
  });

  it("fails loudly, naming the directory, when the install does not produce tsx", () => {
    const { dir } = fakeCheckout({ installed: false });
    const pnpm = fakePnpm(null);

    const run = runBin(dir, dir, pnpm.dir);

    expect(run.status).toBe(1);
    expect(run.stderr).toContain("still missing after an install attempt");
    expect(run.stderr).toContain(dir);
  });
});
