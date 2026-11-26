---
title: "ar-non-isolated-cases-template-stamp-and-pg-transaction-leak"
status: draft
updated: 2026-11-26
rfc: "0061-ci-failures"
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

Follow-up to `ar-non-isolated-cases-cold-files-and-drop-rerun`, which removed
`canonical-model-seats`, `cold-model-construction` and `enum-cold-schema` from
`AR_ISOLATED_CASES` (`vitest.config.ts`). Still open:

- `cases/support/template-stamp.trails.test.ts` stays isolated. On shared-fork
  re-entry, `packages/activerecord/test/support/test-setup-dy.ts` runs
  `resetTestTables`. That drops `ar_internal_metadata`, because
  `BOOKKEEPING_TABLE_NAMES` is outside the boot-laid set
  (`test/support/drop-all-tables.ts:7-24`). Nothing restamps the table. The
  test's own `stampCanonicalSchema` then runs inside the per-test transaction
  and is rolled back, while the pool's `SchemaCache` still answers
  `dataSourceExists("ar_internal_metadata")` as true. Restamping in the setup-dy
  re-entry (`adapterSpecificTables` before the reset, then
  `stampCanonicalSchema` and `schemaMigration.createTable()` after it) fixed
  the test on SQLite. On PostgreSQL it took shard 1/3 from 4 failed files to 69,
  with "current transaction is aborted" at file setup. A prior file leaves a
  transaction open on the leased connection, and the restamp queries run
  inside it. Fix that leak first, or restamp on a connection that is known
  clean.
- `message-pack-message-serializer.trails.test.ts` stays isolated by
  construction: it asserts a module was never loaded.
- PostgreSQL shard 1, CI run 45889204650, job 140151017861: the non-isolated
  pass took 255.8s against 78–105s on the other shards.
  `transaction-isolation.test.ts` took 155s of it. Its `TransactionIsolationTest`
  raises "cannot set transaction isolation in a nested transaction" and its
  `afterAll` times out at 30s, leaving `Tag` and `Tag2` pools in the writing
  list. The re-run of 21 files cost 41s. A local shard 1 run passed the file in
  1.7s, so the leaker was not identified.
- Collect a week of `::warning title=AR non-isolated re-run::` annotations
  from `main` (SQLite, PostgreSQL, MariaDB), fix each leaker, then remove the
  re-run from `scripts/ci/ar-non-isolated-cases.sh`.

## Acceptance criteria

- `template-stamp.trails.test.ts` leaves `AR_ISOLATED_CASES`, and PG shard
  failure counts do not rise.
- The nested-transaction leak that `transaction-isolation.test.ts` hits on PG
  is fixed at the writer.
- After a week of `main` runs with zero re-runs, the re-run is removed, so a
  non-isolated failure is a red.
