---
title: "delete-trails-copy-of-tasks-cli"
status: draft
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

`scripts/tasks/refine-done.sh` is **not** part of this: it is a btwhooks
integration script invoked by trails refine agents, unrelated to the CLI, and
stays where it is. So `scripts/tasks/` keeps existing (holding `refine-done.sh`
and `tasks.sh`) and the ci.yml path filter that names it stays valid — but the
`pnpm vitest run scripts/tasks` _argument_ must go, or the job fails with "no
test files found".

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
- `scripts/tasks/refine-done.sh` is untouched.
- Blocked until tasks#63 is merged.
