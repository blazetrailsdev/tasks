#!/usr/bin/env bash
# Runs `pnpm trails:track` from the host crontab, and makes a failure reach a
# person instead of a log file.
#
#   scripts/track-trails-cron.sh              one run (what cron calls)
#   scripts/track-trails-cron.sh --crontab    the entry to install, for this checkout
#
# On the HOST, never in the btwhooks container: promotion writes the main
# checkout's node_modules, which the container bind-mounts.
#
# Three things a bare crontab line would get wrong:
#
#   Overlap.  A trails build can outlast an hour. A run that finds the lock
#             held leaves; it does not stack a second build on the first.
#   Silence.  track-trails.sh already prints the failing stage, the log and
#             the `pnpm tasks new` command — to stdout, which cron mails to a
#             box nobody reads. A failed run opens a GitHub issue on this
#             repo instead (or comments on the open one, so a red trails main
#             is one issue that grows, not one per hour), and a run that
#             succeeds again closes it.
#   Whose environment.  Cron's PATH has no pnpm. The run goes through the
#             login shell, which is the environment the CLI is used from.
set -uo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${TRAILS_TRACK_REPO:-blazetrailsdev/tasks}"
LOCK="${TRAILS_TRACK_LOCK:-$HOME/.cache/trails-tracker/cron.lock}"
TITLE="trails tracking is failing"
LOGIN_SHELL="$(getent passwd "$(id -un)" | cut -d: -f7)"

if [ "${1:-}" = "--crontab" ]; then
  cat <<CRON
# Continuous trails tracking (tasks README, "trails is tracked from main").
# Hourly; a run with nothing new exits 0 without building.
17 * * * * '$here/scripts/track-trails-cron.sh'
CRON
  exit 0
fi

mkdir -p "$(dirname "$LOCK")"
exec 9>"$LOCK"
flock -n 9 || exit 0

out="$(mktemp)"
trap 'rm -f "$out"' EXIT
"$LOGIN_SHELL" -lc "cd '$here' && pnpm -s trails:track" >"$out" 2>&1
status=$?

open="$(gh issue list -R "$REPO" --state open --search "\"$TITLE\" in:title" \
  --json number --jq '.[0].number // empty' 2>/dev/null)"

if [ "$status" -eq 0 ]; then
  if [ -n "$open" ]; then
    gh issue close "$open" -R "$REPO" \
      --comment "Tracking passed again: $(tail -n 1 "$out")" >/dev/null
  fi
  exit 0
fi

{
  echo "\`pnpm trails:track\` exited $status on $(hostname) at $(date -Is)."
  echo
  echo '```'
  tail -n 40 "$out"
  echo '```'
} >"$out.body"
if [ -n "$open" ]; then
  gh issue comment "$open" -R "$REPO" --body-file "$out.body" >/dev/null
else
  gh issue create -R "$REPO" --title "$TITLE" --body-file "$out.body" >/dev/null
fi
rm -f "$out.body"
cat "$out"
exit "$status"
