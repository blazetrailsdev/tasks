#!/usr/bin/env bash
# track-trails.sh — consume trails from main, continuously, without ever
# installing a trails that breaks this CLI.
#
# WHY THIS IS NOT JUST `vendor-trails.sh origin/main`
#
# The tasks CLI depends on trails, and the agents dispatched BY this CLI are
# the ones editing trails. Consuming trails from the live checkout would mean a
# broken trails `main` wedges the CLI that dispatches the agent who'd fix it —
# a deadlock, not an outage. The old answer was a static pin, which trades the
# deadlock for unbounded staleness (538 commits, when this script was written)
# and defeats trailmap's second purpose: being a proving ground that surfaces
# real trails gaps while they are still fresh.
#
# The answer here keeps both. Staleness is bounded by however often this runs;
# the deadlock is engineered out by never letting unverified bytes reach the
# checkout the fleet actually runs:
#
#   1. Build trails main in a TRACKING CLONE of our own — never an agent's
#      checkout, which is dirty and on some branch, and which vendor-trails.sh
#      would (correctly) refuse.
#   2. Vendor + install + smoke it in a SCRATCH WORKTREE. This is where a red
#      trails main dies. Nothing the fleet runs has been touched yet.
#   3. Only then apply the same tarballs to the main checkout, install, and
#      smoke AGAIN — rolling back to the previous pin if that second smoke
#      fails for any reason the scratch run could not see.
#   4. Commit and push the bump. The pin stays a real commit: `git revert` of
#      it is the single deliberate action that returns to a known-good state.
#
# A failure is reported, never swallowed — see report_failure below. A silent
# fallback would recreate today's staleness with extra steps and destroy the
# signal the proving-ground idea depends on.
#
# Usage:
#   scripts/track-trails.sh              # track origin/main
#   scripts/track-trails.sh <ref>        # track a specific trails ref
#   TRAILS_TRACK_DRY_RUN=1 ...           # verify a candidate, never touch main
#
# Env:
#   TRAILS_TRACK_CACHE  where the tracking clone and scratch worktree live
#                       (default ~/.cache/trails-tracker)
#   TRAILS_REMOTE       trails clone URL for the first fetch
#                       (default git@github.com:blazetrailsdev/trails.git)
#   TRAILS_TRACK_BASE   tasks ref the candidate worktree is built from
#                       (default origin/main)
set -euo pipefail

REF="${1:-origin/main}"
CACHE="${TRAILS_TRACK_CACHE:-$HOME/.cache/trails-tracker}"
REMOTE="${TRAILS_REMOTE:-git@github.com:blazetrailsdev/trails.git}"
CLONE="$CACHE/trails"
SCRATCH="$CACHE/tasks-candidate"
DRY="${TRAILS_TRACK_DRY_RUN:-}"
# What the candidate worktree is built from. origin/main is what the fleet
# runs; overridable so this script can be exercised from a branch before it is
# the thing on main.
BASE="${TRAILS_TRACK_BASE:-origin/main}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# NB: no early `exit` in the awk — under `pipefail` that SIGPIPEs git and takes
# the whole script down before it has printed a thing.
MAIN="$(cd "$HERE" && git worktree list --porcelain | awk '/^worktree /{if(!f){print $2;f=1}}')"
STATE="$CACHE/last-run.json"

say() { printf '==> %s\n' "$*"; }

# Breakage is surfaced, not swallowed. This is the only exit path that leaves
# the pin behind trails main, so it has to be loud enough that somebody acts on
# it: a non-zero exit for whatever runs this (cron mail, the btwhooks job log),
# a machine-readable record `pnpm trails:status` reads back, and a ready-to-file
# story body — a trails gap trailmap hits is supposed to BECOME a story against
# the framework, so the script writes the story rather than hoping someone does.
report_failure() {
  local stage="$1" sha="$2" log="$3"
  mkdir -p "$CACHE"
  node -e '
    const fs=require("fs");
    fs.writeFileSync(process.argv[1], JSON.stringify({
      outcome: "failed", stage: process.argv[2], trailsSha: process.argv[3],
      pin: fs.readFileSync(process.argv[4],"utf8").trim(),
      at: new Date().toISOString(), log: process.argv[5],
    }, null, 2) + "\n");
  ' "$STATE" "$stage" "$sha" "$MAIN/vendor/TRAILS_PIN" "$log"

  local body="$CACHE/story-body.md"
  cat > "$body" <<BODY
## Context

Continuous trails tracking (\`scripts/track-trails.sh\`) refused to bump
\`vendor/TRAILS_PIN\` past **${sha}**: the candidate failed at stage
\`${stage}\`.

The fleet is unaffected — the bump never reached the main checkout, and the CLI
is still running the previously verified pin — but the pin is now frozen and
will stay frozen at every subsequent run until this is fixed. Staleness
restarts accumulating from here.

Full log: \`${log}\`

## Acceptance criteria

- The trails-side breakage is identified and either fixed in trails or
  registered as a story against the framework.
- \`pnpm smoke\` passes against trails ${sha} or later.
- \`scripts/track-trails.sh\` completes and the pin moves again.
BODY

  cat >&2 <<MSG

  ✗ trails tracking FAILED at stage '${stage}' against trails ${sha:0:9}

    The fleet is safe: the main checkout still runs the previous pin
      $(cat "$MAIN/vendor/TRAILS_PIN" 2>/dev/null || echo '(unknown)')
    and the pin will not move again until this is resolved.

    Log:        ${log}
    Story body: ${body}
    File it:    pnpm tasks new 0136-trailmap trails-tracking-blocked-at-${sha:0:9} \\
                  --body-file ${body}

MSG
  exit 1
}

mkdir -p "$CACHE"

# ── 1. tracking clone ────────────────────────────────────────────────────────
# Ours alone. Never an agent's checkout: those are dirty and on a branch, and a
# dirty tree would be PACKED, making the pin describe bytes nobody can restore.
if [ ! -d "$CLONE/.git" ]; then
  say "cloning trails into $CLONE"
  git clone --quiet "$REMOTE" "$CLONE"
fi
git -C "$CLONE" fetch --quiet origin main
SHA="$(git -C "$CLONE" rev-parse "$REF")"
say "trails $REF = ${SHA:0:9}"

PIN="$(cat "$MAIN/vendor/TRAILS_PIN")"
if [ "$SHA" = "$PIN" ]; then
  say "already at ${SHA:0:9} — nothing to do"
  node -e '
    const fs=require("fs");
    fs.writeFileSync(process.argv[1], JSON.stringify({
      outcome: "current", trailsSha: process.argv[2], pin: process.argv[2],
      at: new Date().toISOString(),
    }, null, 2) + "\n");
  ' "$STATE" "$SHA"
  exit 0
fi

LOG="$CACHE/track-$(date -u +%Y%m%dT%H%M%SZ).log"
say "log: $LOG"

# vendor-trails.sh packs the WORKING TREE and refuses when HEAD is not the ref
# it is told to record — the property that stops a pin from misdescribing the
# installed bytes. A detached checkout satisfies it honestly rather than
# working around it.
git -C "$CLONE" checkout --quiet --detach "$SHA"
# reset --hard as well as clean: `clean` only removes UNTRACKED files, so a
# tracked file edited in the clone (debugging a red run by patching it, say)
# would survive into the next run and get PACKED — the pin would then describe
# bytes that exist nowhere in trails history.
git -C "$CLONE" reset --quiet --hard "$SHA"
git -C "$CLONE" clean -qxfd -e node_modules

# The packages ship `dist` (package.json "files"), so an unbuilt checkout packs
# tarballs with no code in them — which installs fine and fails at import.
say "building trails ${SHA:0:9}"
( cd "$CLONE" && pnpm install --frozen-lockfile && pnpm build ) >>"$LOG" 2>&1 \
  || report_failure "trails-build" "$SHA" "$LOG"

# ── 2. candidate: verify in a scratch worktree ───────────────────────────────
# This is the step that breaks the deadlock. A red trails main dies here, in a
# throwaway checkout with its own node_modules, having touched nothing the
# fleet runs.
say "verifying candidate in $SCRATCH"
git -C "$MAIN" worktree remove --force "$SCRATCH" >/dev/null 2>&1 || true
rm -rf "$SCRATCH"
git -C "$MAIN" fetch --quiet origin main
git -C "$MAIN" worktree add --quiet --detach "$SCRATCH" "$BASE"

{
  "$SCRATCH/scripts/vendor-trails.sh" "$CLONE" "$SHA" \
    && ( cd "$SCRATCH" && pnpm install --prefer-offline && pnpm tsx scripts/smoke-cli.ts )
} >>"$LOG" 2>&1 || report_failure "candidate-smoke" "$SHA" "$LOG"
say "candidate passed"

if [ -n "$DRY" ]; then
  say "dry run — main checkout untouched"
  git -C "$MAIN" worktree remove --force "$SCRATCH" >/dev/null 2>&1 || true
  exit 0
fi

# ── 3. promote into the main checkout ───────────────────────────────────────
# The installed node_modules of the MAIN checkout is the artifact: bin/tasks
# resolves tsx and @blazetrails/* relative to itself, and ~/.local/bin/tasks
# links there, so this is the one tree whose install every agent runs against.
# A commit alone would not update it.
if [ -n "$(git -C "$MAIN" status --porcelain)" ]; then
  say "main checkout is dirty — skipping promotion (someone is working in it)"
  git -C "$MAIN" worktree remove --force "$SCRATCH" >/dev/null 2>&1 || true
  exit 0
fi
PREV="$(git -C "$MAIN" rev-parse HEAD)"
say "promoting ${SHA:0:9} into $MAIN"

rollback() {
  say "rolling back to pin ${PIN:0:9}"
  git -C "$MAIN" checkout --quiet -- vendor package.json pnpm-lock.yaml || true
  git -C "$MAIN" reset --quiet --hard "$PREV"
  ( cd "$MAIN" && pnpm install --prefer-offline ) >>"$LOG" 2>&1 || true
  report_failure "promote" "$SHA" "$LOG"
}

{
  "$MAIN/scripts/vendor-trails.sh" "$CLONE" "$SHA" \
    && ( cd "$MAIN" && pnpm install --prefer-offline && pnpm tsx scripts/smoke-cli.ts )
} >>"$LOG" 2>&1 || rollback

# ── 4. record the bump ──────────────────────────────────────────────────────
git -C "$MAIN" add vendor package.json pnpm-lock.yaml
git -C "$MAIN" commit --quiet -m "chore(vendor): track trails ${SHA:0:9}

Automatic pin bump by scripts/track-trails.sh. Verified by pnpm smoke in a
scratch worktree and again in this checkout before commit.

Revert this commit to return to ${PIN:0:9}."
git -C "$MAIN" push --quiet origin HEAD:main
git -C "$MAIN" worktree remove --force "$SCRATCH" >/dev/null 2>&1 || true

node -e '
  const fs=require("fs");
  fs.writeFileSync(process.argv[1], JSON.stringify({
    outcome: "bumped", trailsSha: process.argv[2], pin: process.argv[2],
    previousPin: process.argv[3], at: new Date().toISOString(),
  }, null, 2) + "\n");
' "$STATE" "$SHA" "$PIN"

say "pinned trails ${SHA:0:9} (was ${PIN:0:9})"
