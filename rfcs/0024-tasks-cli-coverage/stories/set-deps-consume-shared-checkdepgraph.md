---
title: "set-deps: consume shared checkDepGraph instead of restating the DFS"
status: ready
updated: 2026-06-15
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`set-deps-share-validator` (merged trails#3402 / tasks#47) extracted the shared
reference + cycle check as `checkDepGraph()` in the tasks repo's
`scripts/validate-lib.mjs`, and `validate()` now delegates to it. But the CLI's
`set-deps` pre-commit guard in trails `scripts/tasks/cli.ts` (`depCyclePath` /
`setDepsError`, ~`cli.ts:1283`) still **restates** the WHITE/GRAY/BLACK DFS
rather than importing the shared check.

The blocker is repo topology: `cli.ts` runs in trails CI, where the `tasks`
repo (and thus `validate-lib.mjs`) is gitignored (`/tasks` in trails
`.gitignore`) and not checked out — the `scripts/tasks/*.test.ts` suite runs
with no tasks repo present. An unconditional static/dynamic import of
`validate-lib.mjs` would break `cli.test.ts` in CI and the canonical
no-symlink runtime fallback. The two copies can't silently drift today (the
tasks pre-commit hook runs `validate.mjs`), but the duplication remains.

See the deferred-import note at trails `scripts/tasks/cli.ts` above
`depCyclePath`, and tasks `scripts/validate-lib.mjs` `checkDepGraph`.

## Acceptance criteria

- `set-deps` consumes the shared `checkDepGraph` instead of restating the DFS,
  via an approach that survives trails CI (no tasks checkout). Candidate
  approaches: (a) runtime dynamic import from `TASKS_DIR` in the command path
  with the pure `depCyclePath` kept as the CI-tested fallback; (b) vendor the
  shared check into a trails-local module both can use.
- `depCyclePath` / `setDepsError` unit tests in `scripts/tasks/cli.test.ts`
  stay green without a tasks checkout (test names unchanged).
- The post-edit, single-node seeding (`seeds: [id]` with deps overridden to
  the proposed value) is preserved; reference + cycle error strings are
  byte-identical to today.
- Pick one approach explicitly; do not leave both the import and the restated
  DFS live as silent duplicates.
