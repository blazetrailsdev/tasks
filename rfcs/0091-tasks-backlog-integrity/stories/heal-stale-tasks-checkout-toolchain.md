---
title: "bin/tasks: recover checkouts whose node_modules predates a toolchain bump"
status: done
updated: 2026-08-18
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 65
claim: "2026-08-17T16:26:39Z"
assignee: "heal-stale-tasks-checkout-toolchain"
blocked-by: null
closed-reason: null
---

## Context

The tasks CLI moved into the tasks repo in
[tasks#63](https://github.com/blazetrailsdev/tasks/pull/63), which added a
TypeScript toolchain (`tsx`, `typescript`, `vitest`, `@types/node`, `yaml`)
that repo did not previously have. `bin/tasks` execs
`$CODE_DIR/node_modules/.bin/tsx`, so **every tasks checkout that predates the
merge has no `tsx` until someone runs `pnpm install` in it.**

Hit live right after the merge: the canonical checkout at
`~/github/blazetrailsdev/tasks` failed with

    tasks: /home/dean/github/blazetrailsdev/tasks/node_modules/.bin/tsx is
    missing — run 'pnpm install' in /home/dean/github/blazetrailsdev/tasks.

The message is correct and actionable, and `scripts/start-worktree.sh` in both
repos installs for **new** worktrees. The gap is the existing population: the
canonical checkout (fixed by hand) plus the `tasks/` checkout inside every
trails worktree created before the merge. Each is a one-line fix its owner has
to discover by tripping over it.

Relevant code: `bin/tasks` (the `-x "$TSX"` guard) and
`scripts/install-bin.sh`, both in the tasks repo.

## Acceptance criteria

Pick one of:

- `bin/tasks` self-heals: on a missing/stale `tsx`, run `pnpm install --silent`
  in `$CODE_DIR` once and retry, failing loudly only if that also fails. Must
  not run on every invocation (CLI startup is on the hot path for every agent),
  and must be safe when two agents race it in the same checkout.
- Or a swept fix: a helper that enumerates existing trails worktrees'
  `tasks/` symlinks plus the canonical checkout and runs `pnpm install` in
  each, documented as a one-shot to run after a toolchain bump.

Either way:

- Running `pnpm tasks` in a checkout whose `node_modules` predates a toolchain
  change succeeds, or fails with a message naming the exact directory (the
  current behavior is already correct on this last point — do not regress it).
- No change to the resolution order in `bin/tasks`; this is about the `tsx`
  guard only.
