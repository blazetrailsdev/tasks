#!/usr/bin/env bash
# Sync the rfcs/ tree from the OLD repo's origin/main.
#
# origin/main specifically, not the old checkout's working tree: the old CLI's
# read path serves an index built from origin/main, so that is the state its
# `ready`/`next-bundle` reflect and therefore the only state the equivalence
# gate can meaningfully be compared against.
#
# This repo is under live agent traffic — stories are created and released
# continuously — so an import and its gate run must come from the SAME sync. A
# stale tree shows up as a ready queue that is short by a handful of stories,
# which looks exactly like a ranking bug and is not one.
set -euo pipefail
OLD="${1:-$HOME/github/blazetrailsdev/tasks}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

git -C "$OLD" fetch -q origin main
SHA="$(git -C "$OLD" rev-parse origin/main)"

rm -rf "$HERE/rfcs"
git -C "$OLD" archive origin/main rfcs | tar -x -C "$HERE"
echo "$SHA" > "$HERE/.rfcs-sync-sha"

echo "synced rfcs/ from origin/main @ ${SHA:0:9}"
echo "  stories: $(find "$HERE/rfcs" -name '*.md' -path '*stories*' | wc -l)"
