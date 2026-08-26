#!/usr/bin/env bash
# install-bin.sh — put `tasks` on the PATH.
#
# Symlinks ~/.local/bin/tasks (override with $BIN_DIR) at the CANONICAL
# checkout's bin/tasks, never at a worktree's — worktrees come and go, and a
# dangling PATH entry is worse than none. bin/tasks resolves the checkout to
# run from the caller's cwd anyway, so the canonical target still runs a
# trails worktree's own tasks/ CLI when invoked from there.
#
# Idempotent: safe to call from every start-worktree run.
set -euo pipefail

CANONICAL="${TASKS_CANONICAL_DIR:-$HOME/github/blazetrailsdev/tasks}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
TARGET="$CANONICAL/bin/tasks"
LINK="$BIN_DIR/tasks"

if [[ ! -f "$TARGET" ]]; then
  echo "install-bin: $TARGET not found — skipping PATH install" >&2
  exit 0
fi

mkdir -p "$BIN_DIR"

if [[ -L "$LINK" && "$(readlink "$LINK")" == "$TARGET" ]]; then
  exit 0
fi

if [[ -e "$LINK" && ! -L "$LINK" ]]; then
  echo "install-bin: $LINK exists and is not a symlink — leaving it alone" >&2
  exit 0
fi

ln -sfn "$TARGET" "$LINK"
echo "install-bin: linked $LINK -> $TARGET"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "install-bin: note — $BIN_DIR is not on \$PATH; add it to use \`tasks\` directly" >&2 ;;
esac
