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
import { resolveDbPath, resolveTasksDir } from "./db-path.js";
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
import { block, claim, close, markTracking, release, setPriority, statusSet } from "./verbs.js";
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
    console.log(`tasks dir: ${resolveTasksDir()}`);
    console.log(`database:  ${resolveDbPath()}`);
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
      // Ingest creates the ROW — authoring never inserts directly. Running it
      // here is what makes `tasks new X && tasks claim X` work.
      if (r.committed) {
        const ing = await ingest();
        console.log(`  ingest: ${ing.created} created, ${ing.updated} updated`);
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
          `${r.created} created, ${r.updated} updated, ${r.deleted} deleted, ` +
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
