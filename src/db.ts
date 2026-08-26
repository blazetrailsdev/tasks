/**
 * Connection bootstrap + the read-model write-through.
 *
 * Importing `./models/index.js` (not the individual model files) is required:
 * that barrel is what calls registerModel(), and association targets are named
 * by string with no autoloader behind them.
 */
import { renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import config from "../config/database.js";
import { mainWorktree } from "./db-path.js";
import { buildEvents, buildIndex } from "./readmodel.js";
import "./models/index.js";

const ENV = (process.env.TRAILS_ENV ?? "development") as keyof typeof config;

let connected = false;

export async function connect(): Promise<void> {
  if (connected) return;
  await Base.establishConnection(config[ENV]);
  connected = true;
}

/**
 * Regenerate the JSON read-models after a mutation.
 *
 * btwhooks' Go side reads these files off disk (spawnloop.go:1042,
 * rfccharts.go:244) rather than talking to this CLI, so they are the published
 * interface and must be refreshed synchronously — a mutation that doesn't
 * republish is invisible to the spawn loop until the next one does.
 *
 * Published to the MAIN working tree, never the caller's. This defaulted to
 * resolveTasksDir(), which is per-cwd — so an agent running `tasks done` from
 * its worktree refreshed that worktree's index.json and left the canonical one
 * stale. Nothing reads a worktree's copy: btwhooks, the spawn loop and the UI
 * all read the main checkout's. The visible symptom was a merged PR whose story
 * still showed in-progress in the UI while the database said done.
 *
 * Same shape as the ingest scoping bug — the database is global, so anything
 * derived from it has to be written somewhere global too.
 *
 * Cheap enough to do unconditionally: ~120ms for 7k stories, measured.
 * Written via a temp file + rename so a concurrent reader never observes a
 * half-written index.
 */
export async function publishReadModels(tasksDir = mainWorktree()): Promise<void> {
  const index = await buildIndex();
  const events = await buildEvents();
  writeAtomic(join(tasksDir, "index.json"), JSON.stringify(index, null, 2) + "\n");
  writeAtomic(join(tasksDir, "events.json"), JSON.stringify(events, null, 2) + "\n");
}

function writeAtomic(path: string, contents: string): void {
  const tmp = `${path}.tmp${process.pid}`;
  writeFileSync(tmp, contents);
  // rename(2) is atomic within a filesystem, so readers see old or new, never
  // a truncated file. Both paths are in the same dir, so same fs by definition.
  renameSync(tmp, path);
}

/** Thrown by a verb that has decided its outcome and the exit code to carry. */
export class VerbExit extends Error {
  constructor(readonly code: number) {
    super(`verb exit ${code}`);
    this.name = "VerbExit";
  }
}
