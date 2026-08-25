---
title: "Generate the canonical schema file once per run, not once per test file"
status: done
updated: 2026-08-05
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5678
claim: "2026-08-05T00:47:03Z"
assignee: "i18n-date-valid-ordinal-civil-negative-fields"
blocked-by: null
closed-reason: null
---

## Context

`test-setup-dy.ts` is a vitest `setupFile`, so it runs **once per test file**,
in a fresh forked process (measured: 8 test files -> 8 distinct pids, each
re-running the whole module). Rails' equivalent bootstrap runs **once per
process for the entire suite**: `vendor/rails/activerecord/test/cases/test_case.rb:298-300`
calls `ARTest.connect` + `load_schema` in the `ActiveRecord::TestCase` class
body, which is evaluated a single time when the suite loads.

One piece of that per-file cost is schema-file generation:
`packages/activerecord/src/test-setup-dy.ts:44-49` calls
`generateSchemaFile(TEST_SCHEMA, adapter, supportsExpressionIndex(...))`
(`packages/activerecord/src/support/schema-file-generator.ts:126`) before every
single test file. It serialises the whole canonical `TEST_SCHEMA` into a
generated `defineSchema` module on disk. The output is a pure function of
(TEST_SCHEMA, adapter, supportsExpressionIndex) — identical for every file in a
lane — yet it is recomputed and rewritten ~700 times per lane.

Measured (instrumented `test-setup-dy.ts`, 8 files per lane,
`TRAILS_TEST_FORKS=2`): `generateSchemaFile` costs **20-49 ms/file on sqlite,
35-46 ms on PostgreSQL, 22-27 ms on MySQL/MariaDB**. Across ~697 AR test files
that is roughly **17-32 s of pure duplicate work per lane**, on top of the
`supportsExpressionIndex` round trip it forces against a live connection first.

`globalSetup` already exists for exactly this class of once-per-run work:
`packages/activerecord/src/support/template-global-setup.ts` (wired at
`vitest.config.ts:362`) builds the sqlite template there and hands workers a path
through an env var (`WORKER_DB_ENV`, `support/sqlite-template.ts:202-226`).

## Acceptance criteria

- The generated schema file is produced once per run (globalSetup, or memoised on
  disk keyed by adapter + a TEST_SCHEMA/expression-index digest) and its path is
  passed to workers via an env var, the way `WORKER_DB_ENV` already is.
- `test-setup-dy.ts` reads that path instead of calling `generateSchemaFile`
  per file; it still regenerates correctly when the env var is absent (single-file
  local runs, no globalSetup).
- The `supportsExpressionIndex` live-connection probe that only exists to feed
  the generator is not paid per test file (MySQL-8 expression indexes must still
  survive — see the comment at `test-setup-dy.ts:40-43`).
- Instrumented before/after numbers for the `generateSchemaFile` phase on the
  sqlite lane, quoted in the PR.
- Full AR suite green on all three adapter lanes.
