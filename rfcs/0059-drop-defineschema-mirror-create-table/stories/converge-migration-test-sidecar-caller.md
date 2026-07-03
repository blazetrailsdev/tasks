---
title: "converge-migration-test-sidecar-caller"
status: done
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4516
claim: "2026-07-03T21:31:09Z"
assignee: "converge-migration-test-sidecar-caller"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 follow-up, split out of `converge-migration-schema-sidecar-callers`
(which converged the other seven migration/schema/dumper suites off the sidecar
`_pool` onto `Base.connection`). `migration.test.ts` was deliberately left on
the sidecar `_pool` because it has architectural entanglement the sibling files
do not:

- The file avoids a file-scope `setupFixtures()` on purpose — see the comment
  at `packages/activerecord/src/migration.test.ts:305`: adding it calls
  `pushSkipGlobalReset()`, which prevents the per-test DDL cleanup that the
  `MigrationContext`-based sub-describes (ReservedWordsMigrationTest,
  BulkAlterTableMigrationsTest, CopyMigrationsTest, …) depend on.
- `freshAdapterWithPeople()` (`migration.test.ts:59`) hand-builds the canonical
  `people` table via `createTable` precisely because the sidecar `:memory:`
  fallback has no schema — exactly the workaround RFC 0059 wants dropped once
  the suite rides the schema-loaded `Base.connection`.
- The module `afterAll` (`migration.test.ts:153-184`) drops `people` (line 172),
  a canonical table. Under `setupFixtures()` shielding, that drop would corrupt
  sibling files sharing the worker DB and must be removed.

Sites still calling `createTestAdapter` / `createSidecarTestAdapter`:
`migration.test.ts` (freshContext, freshAdapterWithPeople, freshAdapter, the
outer afterEach/afterAll, and ~18 in-test leases including two
`createSidecarTestAdapter` advisory-lock sites at :1293 and :1364).

Rails counterpart: `vendor/rails/activerecord/test/cases/migration_test.rb`
(and migration/\*\_test.rb) — every test rides `ActiveRecord::Base.connection`.

## Acceptance criteria

- `migration.test.ts` rides `Base.connection` instead of a sidecar-leased
  adapter, mirroring migration_test.rb.
- Drop the `freshAdapterWithPeople` `createTable("people", …)` workaround and
  the `people` entry from the module `afterAll` drop-list (people is canonical
  and already materialized/shielded by `setupFixtures()`).
- Preserve per-test DDL cleanup for the bespoke-table sub-describes: audit each
  `MigrationContext`-based test so its bespoke tables (`testings`, `values`,
  `things`, `join_table`, the `bk*` set, …) are dropped in its own
  `finally`/`afterEach` rather than relying on the global reset that
  `setupFixtures()` disables.
- No test renames; `test:compare` delta >= 0; all lanes unaffected.
- 500 LOC ceiling; single PR from main; no stacked PRs.
