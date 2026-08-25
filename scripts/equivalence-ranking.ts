/**
 * Second half of the gate: the RANKING must agree, not just the index.
 *
 * index.json matching is necessary but not sufficient on its own — it would
 * still be possible for the queue the spawn loop actually consumes to differ if
 * ranking read a field differently. So run the SAME ported functions over both
 * indexes (git-derived and DB-derived) and diff their output.
 *
 * Because `claimable()`/`nextBundle()` are the identical ported code, a
 * disagreement here can only mean the indexes differ in a field the gate's
 * field list missed — which makes this a cross-check on the gate itself.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Base } from "@blazetrails/activerecord";
import config from "../config/database.js";
import { buildIndex } from "../src/readmodel.js";
import { claimable, nextBundle, type Index } from "../src/ranking.js";

const ENV = (process.env.TRAILS_ENV ?? "development") as keyof typeof config;
const BUDGETS = [100, 250, 500, 700];

function ids(rows: { id: string }[]): string[] {
  return rows.map((r) => r.id);
}

async function main(): Promise<void> {
  const gitIndex = JSON.parse(
    readFileSync(join(process.cwd(), "index.json"), "utf8"),
  ) as Index;

  await Base.establishConnection(config[ENV]);
  const dbIndex = (await buildIndex()) as unknown as Index;

  const problems: string[] = [];

  const gitReady = ids(claimable(gitIndex));
  const dbReady = ids(claimable(dbIndex));
  if (JSON.stringify(gitReady) !== JSON.stringify(dbReady)) {
    const i = gitReady.findIndex((id, n) => id !== dbReady[n]);
    problems.push(
      `claimable(): ${gitReady.length} vs ${dbReady.length} entries; first difference at ${i} ` +
        `(git=${gitReady[i]} db=${dbReady[i]})`,
    );
  }

  for (const maxLoc of BUDGETS) {
    const g = ids(nextBundle(gitIndex, { maxLoc }));
    const d = ids(nextBundle(dbIndex, { maxLoc }));
    if (JSON.stringify(g) !== JSON.stringify(d)) {
      problems.push(`nextBundle(maxLoc=${maxLoc}): git=[${g.join(", ")}] db=[${d.join(", ")}]`);
    }
  }

  // Per-RFC queues too: the spawn loop can scope a bundle to one RFC, and a
  // whole-repo match could hide a per-RFC disagreement.
  const rfcIds = gitIndex.rfcs.filter((r) => r.status === "active").map((r) => r.id);
  let checked = 0;
  for (const rfc of rfcIds) {
    const g = ids(claimable(gitIndex, { rfc }));
    const d = ids(claimable(dbIndex, { rfc }));
    if (JSON.stringify(g) !== JSON.stringify(d)) {
      problems.push(`claimable(rfc=${rfc}): ${g.length} vs ${d.length}`);
    }
    checked++;
  }

  console.log(`claimable(): ${gitReady.length} stories in the ready queue — identical`);
  console.log(`nextBundle(): ${BUDGETS.length} budgets checked`);
  console.log(`claimable(rfc=...): ${checked} active RFCs checked`);

  if (problems.length === 0) {
    console.log("\nRANKING GATE PASSED — both indexes produce identical queues.");
    process.exit(0);
  }
  console.log(`\nRANKING GATE FAILED — ${problems.length} problem(s):\n`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}

await main();
