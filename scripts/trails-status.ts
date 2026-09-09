/**
 * "Which trails is this actually running, and how far behind is it?"
 *
 * Continuous tracking only stays safe while that question has a cheap, honest
 * answer. `vendor/TRAILS_PIN` is the answer to the first half; this adds the
 * second half — the distance to trails main, and whether the last tracking run
 * bumped, held or FAILED.
 *
 * A held pin is the failure mode that used to be invisible. It exits non-zero
 * once the pin has been stuck past --max-age-hours (default 48), so a cron or
 * a dashboard sees red rather than a quietly ageing pin.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = process.env.TRAILS_TRACK_CACHE ?? join(homedir(), ".cache", "trails-tracker");
const CLONE = join(CACHE, "trails");

const maxAgeHours = Number(
  process.argv.find((a) => a.startsWith("--max-age-hours="))?.split("=")[1] ?? 48,
);

const pin = readFileSync(join(HERE, "vendor", "TRAILS_PIN"), "utf8").trim();
console.log(`pin        ${pin}`);

// The last run's own account of itself. Written on every outcome, including the
// failures — a failed run is exactly the one whose record matters.
type Run = { outcome: string; trailsSha?: string; at: string; stage?: string; log?: string };
let run: Run | undefined;
const statePath = join(CACHE, "last-run.json");
if (existsSync(statePath)) run = JSON.parse(readFileSync(statePath, "utf8")) as Run;

// Only the tracking clone can answer "how far behind" — CI has no trails
// checkout, which is why the tarballs are vendored at all. Absent, we report
// what we know rather than guessing.
let behind: number | undefined;
if (existsSync(join(CLONE, ".git"))) {
  try {
    execFileSync("git", ["-C", CLONE, "fetch", "--quiet", "origin", "main"]);
    const head = execFileSync("git", ["-C", CLONE, "rev-parse", "origin/main"], {
      encoding: "utf8",
    }).trim();
    console.log(`trails     ${head}${head === pin ? "  (current)" : ""}`);
    behind = Number(
      execFileSync("git", ["-C", CLONE, "rev-list", "--count", `${pin}..origin/main`], {
        encoding: "utf8",
      }).trim(),
    );
    console.log(`behind     ${behind} commit${behind === 1 ? "" : "s"}`);
  } catch (e) {
    console.log(`trails     unknown (${(e as Error).message.split("\n")[0]})`);
  }
} else {
  console.log(`trails     unknown (no tracking clone at ${CLONE})`);
}

if (!run) {
  console.log("last run   never — scripts/track-trails.sh has not run on this host");
  process.exit(0);
}

const ageHours = (Date.now() - Date.parse(run.at)) / 3_600_000;
console.log(`last run   ${run.outcome} at ${run.at} (${ageHours.toFixed(1)}h ago)`);

if (run.outcome !== "failed") process.exit(0);

console.log(`           stage: ${run.stage}`);
console.log(`           log:   ${run.log}`);
console.log(`           candidate: ${run.trailsSha}`);

if (ageHours <= maxAgeHours) {
  console.log(`\ntracking is held but recent (< ${maxAgeHours}h) — not yet escalating.`);
  process.exit(0);
}
console.error(
  `\nERROR: the trails pin has been held by a FAILED tracking run for ` +
    `${ageHours.toFixed(0)}h (> ${maxAgeHours}h). Staleness is accumulating and ` +
    `nothing is bumping it. See the log above, and file the story body in ${CACHE}.`,
);
process.exit(1);
