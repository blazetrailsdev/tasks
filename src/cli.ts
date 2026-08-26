#!/usr/bin/env tsx
/**
 * The `tasks` CLI.
 *
 * Read verbs serve the ported pure ranking functions over an index built from
 * the DB. Mutation verbs are transactions (src/verbs.ts). There is no lock
 * file, no pull/rebase/push, and no rollback — see src/verbs.ts for why.
 *
 * Every mutation republishes index.json/events.json, because btwhooks' Go side
 * reads those files rather than calling this CLI.
 */
import { readFileSync } from "node:fs";
import { Base } from "@blazetrails/activerecord";
import { connect, publishReadModels, VerbExit } from "./db.js";
import { buildIndex } from "./readmodel.js";
import { currentBranch, mainWorktree, resolveDbPath, resolveTasksDir } from "./db-path.js";
import { ingest } from "./ingest.js";
import { exportState } from "./export.js";
import {
  claimable,
  formatEmptyBundle,
  emptyBundleReason,
  listFiltered,
  nextBundle,
  storiesTouching,
  summarizeBundle,
  type Index,
  type StoryEntry,
} from "./ranking.js";
import {
  block,
  claim,
  close,
  markTracking,
  recordSpawn,
  release,
  setPriority,
  statusSet,
} from "./verbs.js";
import { newStory } from "./authoring.js";
import type { StoryStatus } from "./models/index.js";

const USAGE = `tasks — RFC/story tracking

Read:
  ready [--rfc R] [--json]         unblocked stories, in ready-queue order
  next-bundle [--max-loc N] [--cluster C] [--rfc R] [--json]
  list [--status S] [--rfc R] [--json]
  show <id>
  touching <path>

Author:
  new <rfc> <slug> [--title T] [--status S] [--cluster C] [--est-loc N]
                   [--body-file F]
                   [--deps a,b] [--packages a,b] [--priority N] [--no-commit]

Mutate:
  claim <id...> [--assignee NAME]
  release <id...>
  in-progress <id...> --pr N
  done <id...> [--pr N]
  record-spawn <id...> --source S [--branch B] [--pane P]
  record-spawn --rfc R --source S [--pane P]      (RFC-scoped, e.g. a refine)
  block <id> <reason>
  close <id> <reason>
  status-set <id> <status>
  priority <id> <n|clear>

Sync:
  ingest                           git -> DB (markdown-owned fields)
  export [--no-commit]             DB -> git (DB-owned fields)
  reindex                          republish index.json / events.json
  where                            print resolved paths
`;

interface Flags {
  [k: string]: string | boolean;
}

function parseArgs(argv: string[]): { cmd: string; pos: string[]; flags: Flags } {
  const [cmd = "", ...rest] = argv;
  const pos: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      pos.push(a);
    }
  }
  return { cmd, pos, flags };
}

const str = (f: Flags, k: string): string | null =>
  typeof f[k] === "string" ? (f[k] as string) : null;
const num = (f: Flags, k: string): number | null => {
  const v = str(f, k);
  return v === null ? null : Number.isFinite(Number(v)) ? Number(v) : null;
};

function row(s: StoryEntry): string {
  const bits = [s.id];
  if (s.est_loc !== null) bits.push(`${s.est_loc} loc`);
  if (s.cluster) bits.push(s.cluster);
  if (s.priority !== null) bits.push(`p${s.priority}`);
  return `  ${bits.join("  ")}`;
}

/** How long `tasks new` waits on its follow-up ingest before giving up on it. */
const NEW_INGEST_TIMEOUT_MS = 45_000;

/**
 * Bound a promise. Used so a busy shared database turns into a clear message
 * about which half landed, rather than a silent multi-minute hang that reads as
 * a failure and invites a duplicating retry.
 */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms).unref(),
    ),
  ]);
}

async function loadIndex(): Promise<Index> {
  return (await buildIndex()) as unknown as Index;
}

async function main(): Promise<number> {
  const { cmd, pos, flags } = parseArgs(process.argv.slice(2));
  if (!cmd || cmd === "help" || flags.help) {
    console.log(USAGE);
    return 0;
  }

  if (cmd === "where") {
    // Say out loud that these two can disagree, and what that means.
    //
    // A worktree's `.git` is a POINTER FILE into the main checkout, so
    // `.git/tasks.db` there is the SHARED database, not a local one. Reporting
    // the two paths side by side without comment reads as "my worktree, my
    // db" — an agent drew exactly that conclusion, ran `ingest` from a PR
    // branch, and published 10 unmerged stories to every agent on the host.
    const dir = resolveTasksDir();
    const main = mainWorktree();
    console.log(`tasks dir: ${dir}`);
    console.log(`database:  ${resolveDbPath()}`);
    console.log(`  the database is SHARED by every worktree of this clone,`);
    console.log(`  and it mirrors main at ${main}`);
    if (dir !== main) {
      const branch = currentBranch(dir);
      console.log("");
      console.log(
        `  NOTE: you are in a worktree on ${branch ?? "a detached HEAD"}, not the main checkout.`,
      );
      console.log(`  Read verbs (ready/list/show/touching) answer from the SHARED db —`);
      console.log(`  they do NOT reflect this branch's markdown.`);
      console.log(`  \`ingest\` deliberately reads main, never this branch.`);
      console.log(`  To check this branch's stories parse, use: pnpm validate`);
    }
    return 0;
  }

  await connect();
  const json = flags.json === true;

  switch (cmd) {
    case "ready": {
      const rows = claimable(await loadIndex(), { rfc: str(flags, "rfc") ?? undefined });
      if (json) console.log(JSON.stringify(rows, null, 2));
      else {
        console.log(`${rows.length} ready`);
        for (const s of rows) console.log(row(s));
      }
      return 0;
    }

    case "next-bundle": {
      const maxLoc = num(flags, "max-loc") ?? 250;
      const opts = {
        maxLoc,
        cluster: str(flags, "cluster") ?? undefined,
        rfc: str(flags, "rfc") ?? undefined,
      };
      const index = await loadIndex();
      const rows = nextBundle(index, opts);
      if (json) {
        // The OBJECT shape is a contract with btwhooks, which unmarshals it
        // into bundleResult (spawnloop.go:706). Emitting a bare array made
        // every spawn attempt fail with "cannot unmarshal array into Go value
        // of type webhook.bundleResult" — the loop stayed enabled, tried, and
        // silently never spawned. Keep the old CLI's keys exactly.
        const summary = summarizeBundle(rows, maxLoc);
        console.log(
          JSON.stringify(
            {
              stories: rows,
              bundle_total_loc: summary.total,
              max_loc: maxLoc,
              lead_exceeds_budget: summary.leadExceedsBudget,
              empty_reason: rows.length === 0 ? emptyBundleReason(index, opts) : null,
            },
            null,
            2,
          ),
        );
        return 0;
      }
      if (rows.length === 0) {
        console.log(formatEmptyBundle(emptyBundleReason(index, opts), maxLoc));
        return 0;
      }
      const { total, leadExceedsBudget } = summarizeBundle(rows, maxLoc);
      console.log(
        `${rows.length} stories, ${total} loc${leadExceedsBudget ? " (over budget)" : ""}`,
      );
      for (const s of rows) console.log(row(s));
      return 0;
    }

    case "list": {
      const rows = listFiltered(await loadIndex(), {
        status: (str(flags, "status") as StoryStatus | null) ?? undefined,
        rfc: str(flags, "rfc") ?? undefined,
      });
      if (json) console.log(JSON.stringify(rows, null, 2));
      else for (const s of rows) console.log(row(s));
      return 0;
    }

    case "show": {
      if (!pos[0]) return usage();
      const index = await loadIndex();
      const s = index.stories.find((x) => x.id === pos[0]);
      if (!s) {
        console.error(`error: story "${pos[0]}" not found`);
        return 1;
      }
      console.log(JSON.stringify(s, null, 2));
      return 0;
    }

    case "touching": {
      if (!pos[0]) return usage();
      const rows = storiesTouching(await loadIndex(), pos[0], { all: flags.all === true });
      if (json) console.log(JSON.stringify(rows, null, 2));
      else for (const s of rows) console.log(row(s));
      return 0;
    }

    // ── authoring ──
    case "new": {
      if (pos.length < 2) return usage();
      const csv = (k: string): string[] | undefined => {
        const v = str(flags, k);
        return v
          ? v
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : undefined;
      };
      const bodyFile = str(flags, "body-file");
      const r = await newStory(pos[0], pos[1], {
        body: bodyFile ? readFileSync(bodyFile, "utf8") : undefined,
        title: str(flags, "title") ?? undefined,
        status: (str(flags, "status") as StoryStatus | null) ?? undefined,
        cluster: str(flags, "cluster"),
        estLoc: num(flags, "est-loc"),
        priority: num(flags, "priority"),
        deps: csv("deps"),
        packages: csv("packages"),
        commit: flags["no-commit"] !== true,
      });
      console.log(`created ${r.path}${r.committed ? " (committed)" : " (uncommitted)"}`);

      // The file and its commit are the DURABLE artifact; the index refresh is
      // derived and can be redone at any time. So a failing or slow ingest must
      // not report the whole command as failed — an agent that sees a non-zero
      // exit re-runs, and a re-run duplicates the story or collides on the slug.
      //
      // Bound it, and say plainly which half landed. Exit 0 either way: the
      // story exists, which is the opposite of what exit 1 communicates.
      if (r.committed) {
        try {
          const ing = await withTimeout(ingest(), NEW_INGEST_TIMEOUT_MS);
          if (ing.created === 0 && ing.updated === 0) {
            console.log(
              `  note: index unchanged — the commit is not on main yet, so the story is not\n` +
                `  queryable. Push it to main (or re-run \`tasks ingest\` once it lands).`,
            );
          } else {
            console.log(`  ingest: ${ing.created} created, ${ing.updated} updated`);
          }
        } catch (e) {
          const why = (e as Error).message.includes("timed out")
            ? "the shared tasks database was busy"
            : (e as Error).message;
          console.error(
            `\nwarning: story file created and committed, but the index was NOT updated (${why}).\n` +
              `  DO NOT re-run \`tasks new\` — it would duplicate the story or collide on the slug.\n` +
              `  Reconcile with:  tasks ingest`,
          );
        }
      }
      break;
    }

    // ── mutations ──
    case "claim": {
      const ids = [...new Set(pos)];
      if (!ids.length) return usage();
      await claim(ids, str(flags, "assignee") ?? ids[0]);
      break;
    }
    case "release": {
      const ids = [...new Set(pos)];
      if (!ids.length) return usage();
      await release(ids);
      break;
    }
    case "in-progress":
    case "done": {
      const ids = [...new Set(pos)];
      const pr = num(flags, "pr");
      if (!ids.length) return usage();
      if (cmd === "in-progress" && pr === null) return usage();
      await markTracking(ids, cmd, pr);
      break;
    }
    case "record-spawn": {
      const ids = [...new Set(pos)];
      const source = str(flags, "source");
      const rfc = str(flags, "rfc");
      if (!source || (!ids.length && !rfc)) return usage();
      await recordSpawn(ids, source, {
        branch: str(flags, "branch"),
        pane: str(flags, "pane"),
        rfc,
      });
      break;
    }
    case "block": {
      if (pos.length < 2) return usage();
      await block(pos[0], pos.slice(1).join(" "));
      break;
    }
    case "close": {
      if (pos.length < 2) return usage();
      await close(pos[0], pos.slice(1).join(" "));
      break;
    }
    case "status-set": {
      if (pos.length < 2) return usage();
      await statusSet(pos[0], pos[1] as StoryStatus);
      break;
    }
    case "priority": {
      if (pos.length < 2) return usage();
      const raw = pos[1];
      await setPriority(pos[0], raw === "clear" ? null : Number(raw));
      break;
    }

    // ── sync ──
    case "ingest": {
      const r = await ingest();
      console.log(
        `ingest ${r.from ? r.from.slice(0, 9) : "(initial)"}..${r.to.slice(0, 9)}: ` +
          `${r.created} created, ${r.updated} updated, ${r.closed} closed, ` +
          `${r.rfcsTouched} rfcs (${r.scanned} paths)`,
      );
      break;
    }
    case "export": {
      const r = await exportState({ commit: flags["no-commit"] !== true });
      console.log(
        r.committed
          ? `exported ${r.changed.length} stories -> ${r.sha?.slice(0, 9)}`
          : `exported ${r.changed.length} stories (no commit)`,
      );
      return 0;
    }
    case "reindex":
      break;

    default:
      console.error(`error: unknown command "${cmd}"`);
      return usage();
  }

  // Every mutation republishes the read-models btwhooks consumes.
  await publishReadModels();
  return 0;
}

function usage(): number {
  console.error(USAGE);
  return 1;
}

try {
  process.exitCode = await main();
} catch (e) {
  if (e instanceof VerbExit) {
    process.exitCode = e.code;
  } else {
    console.error(`error: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
// Explicit: the connection pool would otherwise keep the event loop alive.
try {
  Base.connection.disconnect();
} catch {
  /* already closed */
}
process.exit(process.exitCode ?? 0);
