---
title: "resolveTasksDir silently falls back to canonical when run from inside a tasks worktree"
status: done
updated: 2026-08-18
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 66
claim: "2026-08-17T16:29:30Z"
assignee: "resolve-tasks-dir-from-inside-a-tasks-checkout"
blocked-by: null
closed-reason: null
---

## Context

`resolveTasksDir()` (tasks repo, `scripts/cli.ts`) resolves which working tree
the CLI acts on as:

1. `$TASKS_DIR`
2. `$RFCS_DIR`
3. `<cwd>/tasks`, when it has a `.git` entry (the per-worktree symlink
   trails' `start-worktree.sh` creates)
4. `~/github/blazetrailsdev/tasks` (canonical)

Step 3 only ever matches from **inside a trails worktree**. Run the CLI from
inside a _tasks_ worktree — `~/github/blazetrailsdev/tasks-worktrees/<name>` —
and there is no `<cwd>/tasks`, so it silently falls through to **step 4 and
mutates the canonical checkout**, not the worktree you are standing in.

This predates [tasks#63](https://github.com/blazetrailsdev/tasks/pull/63), but
that PR makes it live: the CLI source now lives in the tasks repo, so agents
edit it from a tasks worktree and will naturally run it there to test a change.
The canonical checkout is documented as SHARED across agents, and the repo is
trunk-only — so the failure mode is an agent's story mutation landing on main
from a checkout they did not intend to touch, or colliding with a sibling's
uncommitted work in canonical.

It is also silent: there is no output naming the resolved directory, and the
canonical checkout is usually clean and current, so the command appears to
work.

Note the interaction that makes the naive fix wrong: `TASKS_DIR_IS_SYMLINK`
(same file) keys off `$TASKS_DIR` being **unset** to choose the `HEAD:main`
push refspec over `main`. Exporting `$TASKS_DIR` from a wrapper to "fix" the
resolution would flip every per-worktree push back to `main`. This is exactly
why trails' `scripts/tasks/tasks.sh` shim deliberately does not set it — see
`scripts/tasks-shim.test.ts` in trails, which pins that contract.

## Acceptance criteria

- Running the CLI with a cwd inside a tasks checkout (a worktree or canonical)
  acts on **that** checkout, not on canonical-by-fallback. Detect via
  `git rev-parse --show-toplevel` / the presence of `rfcs/` + `scripts/cli.ts`
  at or above cwd, ahead of the canonical fallback.
- The push refspec stays correct for every case: a non-canonical checkout
  reached this new way must still push `HEAD:main`, not `main`. Extend the
  `TASKS_DIR_IS_SYMLINK` logic rather than bolting the new branch on beside it
  — the flag's name and meaning both need revisiting once "per-worktree" is no
  longer synonymous with "reached via the symlink".
- Unit coverage in the tasks repo's `scripts/cli.test.ts` for the new arm and
  for the refspec it selects.
- No change to the precedence of explicit `$TASKS_DIR` / `$RFCS_DIR`.
