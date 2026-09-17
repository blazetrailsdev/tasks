---
title: "Shard the sqlite-mem AR suite 2-way, the last unsharded copy of the AR file set"
status: draft
updated: 2026-09-17
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Not a Rails deviation: `.github/workflows/ci.yml` is CI configuration with no
Rails counterpart, so there is no gem path to converge toward. This is a sized
CI follow-up.

trails#7856 sharded `sqlite-tests` 2-way, closing the gap left when
`shard-ar-adapter-suites` (RFC 0028, trails#4546) sharded PG/MariaDB and left
SQLite unsharded as "not on the critical path". Measured result: 749s median →
409s/374s per leg (−45%), full coverage verified (379+378=757 files,
5879+7198=13077 tests, matching the unsharded baseline exactly).

**`sqlite-mem-tests` was left out of that PR and is now the last unsharded copy
of the AR suite.** It runs the same `pnpm vitest run packages/activerecord/`
over the whole file set with `ARCONN=sqlite3_mem`, taking ~9m on green main run 35248787117. It is in the `ci` aggregator's `needs:`, so whenever it runs a
failure blocks the merge — and it runs on every `main` push, the Monday sweep,
`workflow_dispatch`, and any PR labelled `run-sqlite-mem`. On those paths it is
now the AR critical path, ahead of the sharded sqlite lane it mirrors.

## Converged shape

Mirror what trails#7856 did to `sqlite-tests` (`.github/workflows/ci.yml`,
`sqlite-mem-tests` job):

- `strategy: fail-fast: false` + `matrix: shard: [1, 2]`
- `pnpm vitest run packages/activerecord/ --shard=${{ matrix.shard }}/2`,
  keeping `env: ARCONN: sqlite3_mem`

Simpler than `sqlite-tests` was: this job has no `activerecord-cli` step and no
`scripts/` step, so there is nothing to pin to shard 1 — the whole job is the
one shardable command. No service container to duplicate either.

No aggregator change: the `ci` job keys its `needs:` and its skip-reason `case`
on the job id, and GitHub collapses matrix legs under it, so the existing
`sqlite-mem-tests)` arm (with its `SQLITE_MEM_UNLABELLED` guard) covers both
legs unchanged — exactly as `sqlite-tests)` did through trails#7856. The `main`
ruleset requires only the `CI` context, so no required-check names change.

## Acceptance criteria

- `sqlite-mem-tests` runs as a 2-way `--shard` matrix.
- Full coverage across legs: per-leg file and test counts sum to the unsharded
  totals (757 files / 13077 tests on the baseline above); none double-run.
- `ci` aggregate resolves for both legs with no allowlist edit, and the
  `run-sqlite-mem` label path still gates correctly.
- Measured improvement against the ~9m before-number, per RFC 0028's wall-time
  merge bar; close without merging if it does not beat it.
