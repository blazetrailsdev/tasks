#!/usr/bin/env bash
# Take a FINAL import that is not racing live writes.
#
# Why this needs to be a loop rather than one command: the import takes ~40-75s,
# and a measured rehearsal had 5 commits land during it. A story marked `done`
# in that window would be silently lost, because `tasks ingest` CANNOT fix it
# afterwards — ingest applies only markdown-owned fields and deliberately
# ignores status/pr/claim/assignee, so state that arrives after the import has
# no path into the database.
#
# So the final import must be the last word. This syncs, imports, and then
# checks whether origin/main moved while it ran; if it did, the import is stale
# and the whole thing repeats. Converges as soon as writes stop.
#
# Usage: scripts/cutover-import.sh [max-attempts]
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
OLD="${OLD_TASKS_DIR:-$HOME/github/blazetrailsdev/tasks}"
MAX="${1:-6}"

cd "$HERE"

for attempt in $(seq 1 "$MAX"); do
  echo "── attempt $attempt/$MAX ──────────────────────────────"

  ./scripts/sync-rfcs.sh "$OLD" >/dev/null
  synced="$(cat "$HERE/.rfcs-sync-sha")"
  echo "  synced from ${synced:0:9}"

  start=$(date +%s)
  pnpm tsx scripts/import.ts 2>&1 | grep -E "^imported|^backfilled" | sed 's/^/  /'
  elapsed=$(( $(date +%s) - start ))

  git -C "$OLD" fetch -q origin main
  now="$(git -C "$OLD" rev-parse origin/main)"
  drift="$(git -C "$OLD" rev-list --count "${synced}..${now}" 2>/dev/null || echo '?')"

  if [ "$drift" = "0" ]; then
    echo "  no drift during ${elapsed}s import — this import is authoritative"
    echo
    echo "origin/main is quiet at ${now:0:9}. Run the gates now:"
    echo "  pnpm gate"
    exit 0
  fi

  echo "  DRIFT: $drift commit(s) landed during the ${elapsed}s import — stale, retrying"
  git -C "$OLD" log --oneline "${synced}..${now}" | sed 's/^/    /' | head -5
  echo
  sleep 20
done

echo "still taking writes after $MAX attempts — pause the spawn loop before cutting over" >&2
exit 1
