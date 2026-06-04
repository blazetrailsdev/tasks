#!/usr/bin/env bash
# start-worktree.sh — spin up a fresh tasks worktree ready to work in.
#
# Usage: scripts/start-worktree.sh <name>
#
#   1. Fast-forwards the main worktree's view of origin/main (fetch only).
#   2. Creates ~/github/blazetrailsdev/worktrees/<name> on a new branch <name>
#      branched off origin/main.
#   3. Runs `pnpm install` inside the new worktree so validate/build-index/
#      lint hooks work.
#
# Mirrors trails' scripts/start-worktree.sh but without the vendor-source and
# skills linking that repo needs — tasks is just markdown + a little tooling.
set -euo pipefail

if [[ $# -ne 1 || -z "${1:-}" ]]; then
  echo "Usage: $0 <name>" >&2
  exit 2
fi

NAME="$1"
case "$NAME" in
  */*|*..*|"") echo "Invalid worktree name: $NAME" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Resolve the main repo even when invoked from a child worktree (where .git is
# a file, not a dir): use --git-common-dir to find the shared gitdir and walk
# up one level. See the trails script for the full rationale.
WORKTREE_ROOT="$(cd "$SCRIPT_DIR/.." && git rev-parse --show-toplevel)"
GIT_COMMON_DIR="$(cd "$WORKTREE_ROOT" && git rev-parse --git-common-dir)"
case "$GIT_COMMON_DIR" in
  /*) MAIN_GIT_DIR="$GIT_COMMON_DIR" ;;
  *)  MAIN_GIT_DIR="$WORKTREE_ROOT/$GIT_COMMON_DIR" ;;
esac
MAIN_REPO="$(cd "$MAIN_GIT_DIR/.." && pwd)"
WORKTREES_ROOT="$HOME/github/blazetrailsdev/worktrees"
TARGET="$WORKTREES_ROOT/$NAME"

if [[ -e "$TARGET" ]]; then
  echo "Target already exists: $TARGET" >&2
  exit 1
fi

echo "==> Fetching origin/main at $MAIN_REPO"
# Serialize fetch + worktree add across concurrent invocations — git's ref
# locks fail loudly when two runs race the same ref / packed-refs file.
exec 9>"$MAIN_GIT_DIR/start-worktree.lock"
if ! flock -w 60 9; then
  echo "Could not acquire $MAIN_GIT_DIR/start-worktree.lock within 60s." >&2
  echo "Another start-worktree run may be stuck. Investigate, then retry." >&2
  exit 1
fi
git -C "$MAIN_REPO" fetch origin --prune

# Branch off origin/main, NOT local main, so a lagging or dirty main checkout
# never blocks the worktree creation.
mkdir -p "$WORKTREES_ROOT"

echo "==> Creating worktree at $TARGET on new branch '$NAME' from origin/main"
git -C "$MAIN_REPO" worktree add -b "$NAME" "$TARGET" origin/main
flock -u 9
exec 9>&-

# Tear down a half-created worktree if setup below fails, so a re-run doesn't
# hit "Target already exists". Cleared on success at the bottom.
WORKTREE_CREATED=1
cleanup_partial_worktree() {
  if [[ "${WORKTREE_CREATED:-0}" != 1 ]]; then return; fi
  echo "==> Removing partial worktree $TARGET" >&2
  if ! git -C "$MAIN_REPO" worktree remove --force "$TARGET" 2>/dev/null; then
    echo "    git worktree remove failed; falling back to rm -rf + git worktree prune" >&2
    rm -rf "$TARGET"
    git -C "$MAIN_REPO" worktree prune 2>/dev/null || true
  fi
  if ! git -C "$MAIN_REPO" branch -D "$NAME" 2>/dev/null; then
    echo "    note: branch $NAME was not deletable (already gone or never created)" >&2
  fi
}
trap cleanup_partial_worktree EXIT

echo "==> Running pnpm install"
( cd "$TARGET" && pnpm install )

WORKTREE_CREATED=0  # success — disable EXIT-trap cleanup

echo
echo "Done. New worktree:"
echo "  $TARGET"
echo "  branch: $NAME (tracking nothing yet — push with: git push -u origin $NAME)"
