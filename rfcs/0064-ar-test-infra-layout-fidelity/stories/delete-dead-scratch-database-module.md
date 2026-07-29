---
title: "delete-dead-scratch-database-module"
status: blocked
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-29T20:16:12Z"
assignee: "delete-dead-scratch-database-module"
blocked-by: "Blocked on PRs #5598 and #5599 (both still open); deleting support/scratch-database.ts before they merge breaks the typecheck of whichever PR still imports scratchDatabasePath."
closed-reason: null
---

## Context

`support/scratch-database.ts` (plus `scratch-database.test.ts`) is the last
surviving piece of the per-test-file throwaway-database invention. Rails' AR
suite has exactly two databases, `arunit` and `arunit2`
(`vendor/rails/activerecord/test/config.example.yml:83-91`), both fixed files
reused across runs; it has no notion of a temp database minted per test label.

Its callers are being removed by two PRs that landed independently:

- PR #5598 (`sweep-temp-sqlite-dbs-on-non-sqlite-lanes`) converges
  `multi-db-migrator.test.ts:10` and `associations.test.ts:47` onto
  `Base.leaseConnection()` / `ARUnit2Model.leaseConnection()`.
- PR for `converge-isolated-database-onto-canonical-pools` deletes
  `support/isolated-database.ts` and rides the arunit2 pool in
  `support/drop-all-tables.test.ts`.

Neither could delete `scratch-database.ts` itself without overlapping the
other's files, so once both are merged the module is dead code with a live test
file.

## Acceptance criteria

- `git grep scratchDatabasePath` returns nothing; delete
  `packages/activerecord/src/support/scratch-database.ts` and
  `packages/activerecord/src/support/scratch-database.test.ts`.
- `sqlite-template.ts`'s `TEMP_DB_PREFIX` docblock (~line 100) no longer lists
  "the scratch databases (`support/scratch-database.ts`)" as a producer.
- Confirm the only remaining `ar-test-*` producers are the template/worker
  clones and `connection.ts`'s `fallbackDatabasePath` (sqlite lane only). The
  latter is itself Rails-less — Rails' sqlite `arunit` is a configured file, not
  a per-process temp path — and gets its own story; do not fold it in here.

## Notes

Blocked until both PRs above are merged: deleting the module earlier breaks the
typecheck of whichever PR still imports it.
