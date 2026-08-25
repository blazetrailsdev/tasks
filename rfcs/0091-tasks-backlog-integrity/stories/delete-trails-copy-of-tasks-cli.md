---
title: "delete-trails-copy-of-tasks-cli"
status: ready
updated: 2026-08-17
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `tasks` CLI moved into the tasks repo in
[tasks#63](https://github.com/blazetrailsdev/tasks/pull/63): `scripts/cli.ts`,
`scripts/cli.test.ts`, and a new `bin/tasks` entrypoint now live there, and
trails' `pnpm tasks` delegates to it through `scripts/tasks/tasks.sh`
(trails PR flipping the shim: see the linked PR on this story).

The move was deliberately split so the tasks-repo CLI is proven **in use**
before the trails copy is removed. That leaves trails carrying a dead
duplicate that still costs CI time and will silently drift from the live one:

- `scripts/tasks/cli.ts` — 3737 LOC, no longer the `pnpm tasks` entrypoint
- `scripts/tasks/cli.test.ts` — 4378 LOC / 336 tests, still collected
- `vitest.config.ts:439` — `"scripts/tasks/*.test.ts"` in the unit-test project
  `include`
- `.github/workflows/ci.yml:592` — `scripts/tasks` in the `pnpm vitest run`
  argument list for the unit-tests job

`scripts/tasks/refine-done.sh` is not part of this either, but no longer for
the reason once written here: it has **moved into this repo** as
`scripts/refine-done.sh` (tasks#64), along with its never-merged sibling
`rfc-refine-done.sh`. The old rationale — "invoked by trails refine agents" —
was simply wrong: refine agents run in a _tasks_ worktree (btwhooks spawns them
with `RepoDir=<tasks checkout>`), so the script was in trails only by accident
of where it was first written. trails#6658 deletes the trails copy.

So `scripts/tasks/` keeps existing only for `tasks.sh`, and the ci.yml path
filter that names it stays valid — but the `pnpm vitest run scripts/tasks`
_argument_ must go, or the job fails with "no test files found".

`scripts/ci-suite-coverage.test.ts` mentions `scripts/tasks` in three comments
(lines 15, 265, 322) describing which suites ride the unit-tests gate; those
need a pass to stay accurate.

## Acceptance criteria

- `scripts/tasks/cli.ts` and `scripts/tasks/cli.test.ts` are deleted from
  trails.
- `scripts/tasks/*.test.ts` is removed from the `include` list in
  `vitest.config.ts`, and `scripts/tasks` is removed from the `pnpm vitest run`
  arguments in `.github/workflows/ci.yml`.
- `scripts/ci-suite-coverage.test.ts` passes, with its `scripts/tasks`
  references updated to reflect that the suite no longer lives in trails.
- `pnpm tasks ready`, `next-bundle`, `claim`, and `new` still work from a
  trails worktree via `scripts/tasks/tasks.sh`, operating on that worktree's
  own `tasks/` checkout (not the canonical one).
- `scripts/tasks/refine-done.sh` is already gone (trails#6658); do not expect it.
- Blocked until tasks#63 is merged.
