/**
 * The bootstrap smoke check: can the `tasks` CLI still do its job on the
 * trails that is currently installed?
 *
 * This is the gate `track-trails.sh` puts in front of every pin bump, and it
 * is the whole reason continuous tracking is safe. The hazard the static pin
 * existed to avoid is a deadlock: agents dispatched BY this CLI are the ones
 * editing trails, so a trails `main` that breaks the CLI wedges the fleet that
 * would fix it. A bump that cannot pass this check is never installed.
 *
 * So it exercises the dispatch path end to end, against a throwaway database:
 *
 *   1. `Base.establishConnection` + migrations — DDL through trails.
 *   2. A write through the models — inserts, enums, timestamps.
 *   3. The ready queue — the query the spawn loop actually asks for.
 *   4. `bin/tasks ready --json` as a subprocess — the shipped entry point,
 *      resolving its own node_modules, exactly as an agent invokes it.
 *
 * Step 4 is not redundant with 1-3: the first three run under this process's
 * module graph, and a trails change that breaks only the packaged `dist`
 * (a bad export map, a missing file in `files`) is invisible until something
 * spawns the real binary.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(join(tmpdir(), "tasks-smoke-"));
const db = join(scratch, "smoke.db");

// Set BEFORE importing anything that reads it: config/database.ts calls
// resolveDbPath() at module scope, so a later assignment would be too late and
// the smoke would silently run against the real, shared tasks.db.
process.env.TASKS_DB = db;

let failed = false;
const step = async (name: string, fn: () => Promise<unknown>) => {
  try {
    await fn();
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed = true;
    console.log(`  FAIL  ${name}`);
    console.log(String((e as Error)?.stack ?? e).replace(/^/gm, "        "));
  }
};

console.log(`smoke: ${db}`);

// Imported dynamically, and inside the reporting harness: a red trails main
// most often fails at module evaluation, and a bare top-level `import` would
// crash out of this file before a single step had reported.
type Mods = {
  Base: typeof import("@blazetrails/activerecord").Base;
  config: (typeof import("../config/database.js"))["default"];
  migrate: (typeof import("../src/migrator.js"))["migrate"];
  Rfc: (typeof import("../src/models/rfc.js"))["Rfc"];
  Story: (typeof import("../src/models/story.js"))["Story"];
  claimable: (typeof import("../src/ranking.js"))["claimable"];
  buildIndex: (typeof import("../src/readmodel.js"))["buildIndex"];
};
let m!: Mods;
await step("import trails and the app modules", async () => {
  const [ar, db, migrator, rfc, story, ranking, readmodel] = await Promise.all([
    import("@blazetrails/activerecord"),
    import("../config/database.js"),
    import("../src/migrator.js"),
    import("../src/models/rfc.js"),
    import("../src/models/story.js"),
    import("../src/ranking.js"),
    import("../src/readmodel.js"),
  ]);
  m = {
    Base: ar.Base,
    config: db.default,
    migrate: migrator.migrate,
    Rfc: rfc.Rfc,
    Story: story.Story,
    claimable: ranking.claimable,
    buildIndex: readmodel.buildIndex,
  };
});
if (failed) {
  rmSync(scratch, { recursive: true, force: true });
  console.log("smoke: FAILED");
  process.exit(1);
}

await step("connect + migrate", async () => {
  await m.Base.establishConnection(m.config.development);
  await m.migrate();
});

await step("write through the models", async () => {
  await m.Rfc.create({ id: "9999-smoke", title: "smoke", status: "active", priority: 1 });
  await m.Story.create({
    id: "smoke-story",
    rfc_id: "9999-smoke",
    title: "smoke",
    status: "ready",
  });
});

await step("ready queue", async () => {
  // Same cast the CLI's own loadIndex() makes (src/cli.ts:136).
  const index = (await m.buildIndex()) as unknown as Parameters<Mods["claimable"]>[0];
  const rows = m.claimable(index);
  if (!rows.some((s) => s.id === "smoke-story")) {
    throw new Error(`ready queue did not surface the smoke story (${rows.length} rows)`);
  }
});

await step("bin/tasks ready --json (packaged dist)", async () => {
  const out = execFileSync(join(HERE, "bin", "tasks"), ["ready", "--json"], {
    encoding: "utf8",
    env: { ...process.env, TASKS_DB: db },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(out);
  if (!Array.isArray(parsed)) throw new Error(`expected a JSON array, got ${typeof parsed}`);
});

rmSync(scratch, { recursive: true, force: true });
console.log(failed ? "smoke: FAILED" : "smoke: ok");
process.exit(failed ? 1 : 0);
