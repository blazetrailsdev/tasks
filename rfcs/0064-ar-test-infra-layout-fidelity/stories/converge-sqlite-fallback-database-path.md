---
title: "converge-sqlite-fallback-database-path"
status: ready
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
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

`support/connection.ts:332-349`'s `fallbackDatabasePath` mints
`<tmpdir>/ar-test-fallback-<runToken>-<slot>.sqlite` whenever
`AR_TEST_WORKER_DB` is unset, and `sqliteHash` (`connection.ts:351-359`) feeds
it to the `sqlite3` connection's `arunit` entry as `database`.

Rails has no counterpart. `config.example.yml:83-91` names both sqlite
databases as fixed files under `FIXTURES_ROOT`, reused across runs; the path is
never derived from a process token. With `AR_TEST_RUN_TOKEN` unset the trails
fallback goes further and invents its own random token
(`connection.ts:337-339`), so the file is not even stable within a machine —
and it is stamped with a token the globalSetup teardown sweep does not know, so
only the 6h age gate ever collects it.

`support/scratch-database.ts` was the other `ar-test-*` producer with no Rails
counterpart; it is being removed (see `converge-isolated-database-onto-canonical-pools`
and `delete-dead-scratch-database-module`). After that, `fallbackDatabasePath`
is the only Rails-less one left, which is why it was split out rather than
folded in.

## Acceptance criteria

- The sqlite `arunit` database name comes from configuration on every path, not
  from a per-process temp path: either the worker bootstrap always supplies
  `AR_TEST_WORKER_DB` (making the fallback unreachable, so it can be deleted),
  or the fallback resolves to a fixed configured file the way Rails'
  `FIXTURES_ROOT`-relative names do.
- No `ar-test-fallback-*` file is minted by a normal `pnpm vitest run` on any
  lane; a setup-free single-file run still connects.
- Do NOT widen the temp-file sweep as a substitute — that is what PR #5590 did
  and it was closed for hardening the deviation instead of removing it.
