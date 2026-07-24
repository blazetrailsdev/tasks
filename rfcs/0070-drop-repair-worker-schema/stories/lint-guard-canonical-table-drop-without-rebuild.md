---
title: "Lint-guard a canonical table dropped without a rebuild"
status: ready
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`require-table-teardown` balances raw-SQL DDL **per table name**: a raw
`CREATE TABLE foo` in a sink argument is satisfied by a raw `DROP TABLE foo`
anywhere in the same file (`eslint/require-table-teardown.mjs`, the "Raw-SQL
leaks" section). That catches a bespoke table that outlives its test.

It does not catch the inverse, which is what actually drifted `subscribers`
(story `restore-subscribers-canonical-table`, PR #5256): a test file that
**drops a canonical table and leaves it dropped**. In
`packages/activerecord/src/adapters/mysql2/mysql2-adapter.trails.test.ts` the
old code hand-rolled `CREATE TABLE subscribers` and dropped it in a `finally`
— perfectly balanced by the rule's accounting, and yet it left the shared
per-worker MySQL database with the canonical `subscribers` missing, which
`repairWorkerSchema` (`packages/activerecord/src/test-helpers/schema-repair.ts`)
then had to repair for the next file.

The missing invariant: a canonical table name (a key of `TEST_SCHEMA` in
`packages/activerecord/src/test-helpers/test-schema.ts`) may be dropped by a
test file only if that file also restores it — via `rebuildCanonicalTables`
(`test-helpers/canonical-schema.ts`) or an equivalent canonical rebuild.

Note the rule must not false-positive on the legitimate drop-then-rebuild
pattern, e.g. `adapters/mysql2/mysql2-adapter.test.ts:186-190`, which drops
`engines`/`old_cars`/`cars`/`subscribers`/`people` in a `beforeEach` and
immediately calls `rebuildCanonicalTables` on them. Files operating on a
private `:memory:` adapter (`adapter-prevent-writes.test.ts`) are also not
leaks — they never touch the shared DB — so the rule likely needs an
exclusion list on the same pattern as
`eslint/require-table-teardown-raw-sql-exclude.json`.

## Acceptance criteria

- A lint rule (extending `require-table-teardown` or a sibling) flags a test
  file that drops a canonical table — raw `DROP TABLE` in a sink argument or
  the `dropTable` helper — without a canonical rebuild of that same table in
  the file.
- The rule fails on the pre-#5256 body of the `#exec_query queries with an
empty result set still return the columns` test (regression-fails on
  baseline) and passes on the current tree.
- No false positive on `adapters/mysql2/mysql2-adapter.test.ts` or on
  `:memory:`-scoped files.
- Rule unit tests alongside, matching `require-table-teardown.test.mjs`.
