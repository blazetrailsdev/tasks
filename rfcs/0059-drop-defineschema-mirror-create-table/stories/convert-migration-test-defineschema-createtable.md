---
title: "convert-migration-test-defineschema-createtable"
status: claimed
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-07-03T17:21:50Z"
assignee: "convert-migration-test-defineschema-createtable"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 residual sweep (convert-defineschema-residual-sweep, PR TBD) resolved
23 of the 24 orphan `defineSchema` test files as canonical-ride no-ops, but
`packages/activerecord/src/migration.test.ts` (5 live `defineSchema` calls) is a
genuine bespoke case and was deferred here.

Unlike the handler-DB files, migration.test.ts's people/values tests run against
a bare `createTestAdapter()` leased connection whose SQLite DB has **no** canonical
schema (verified: a fresh leased adapter MISSes `posts`/`topics`/`tags`/`people`/
`values`). The `defineSchema` calls were therefore materializing real tables, not
cache-hits:

- `freshAdapterWithPeople()` (migration.test.ts:59) — `defineSchema(adapter,
{ people: TEST_SCHEMA.people })`; consumed by 8 people-migration tests
  (add_column/remove_column "people", "last_name" through a Migrator).
- `ReservedWordsMigrationTest > drop index from table named values` (~:1425) —
  `defineSchema(adapter, { values: TEST_SCHEMA.values })`.
- `ExplicitlyNamedIndexMigrationTest > drop index by name` (~:1440) — same.

TEST_SCHEMA shapes to mirror: `people` (test-schema.ts:1147, 15 cols incl.
`first_name` NOT NULL, `lock_version`, timestamps); `values` (test-schema.ts:1742,
cols `as`/`group_id`, primaryKey `["as"]`, a SQL reserved word).

## Acceptance criteria

- Replace the 3 `defineSchema` calls in migration.test.ts with
  `connection.createTable(...)` (or `ctx.createTable`) that mirror the canonical
  `people`/`values` shapes faithfully (no fabricated/reduced shapes), plus
  teardown (drop with ifExists) so the shared worker DB is not leaked.
- `git grep -c defineSchema packages/activerecord/src/migration.test.ts` -> 0.
- No test renames; migration.test.ts passes on sqlite (and PG/MySQL lanes in CI).
- Single PR from main, <=500 LOC.
