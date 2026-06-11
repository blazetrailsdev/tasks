---
title: "Burn down the require-table-teardown exclude list (18 files, 3 dropAllTables)"
status: ready
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3123 (merged, `feat(eslint): add require-table-teardown rule for AR tests`)
added the `blazetrails/require-table-teardown` ESLint rule over
`packages/activerecord/src/**/*.test.ts`:

1. Every `createTable("foo", …)` must be balanced by an explicit
   `dropTable("foo")` in the same file (per static table name).
2. `dropAllTables()` is **forbidden** (`noDropAllTables`) — a test must drop the
   specific tables it created, by name.

This is the enforcement machinery that makes per-table teardown possible and is a
sibling ratchet to `require-canonical-schema` (this RFC's main lever). It shipped
with **18 grandfathered violators** in `eslint/require-table-teardown-exclude.json`
as the ratchet baseline. This story is the program to **burn that list to zero**:
give each file explicit per-table teardown and remove its exclude entry. New/fixed
files are already enforced at `"error"`; `test-helpers/**` is exempt by design.

The 18 files (remove each from the exclude JSON as it's fixed):

- `active-record-schema.test.ts` _(uses dropAllTables)_
- `normalized-attribute.test.ts` _(uses dropAllTables; also grandfathered in
  require-canonical-schema-exclude — converge both in one pass)_
- `statement-cache.test.ts` _(uses dropAllTables; already on canonical schema —
  the `afterAll(dropAllTables)` is redundant teardown, see the
  `drop-legacy-crutches` audit Bucket 4)_
- `adapters/abstract-mysql-adapter/active-schema.test.ts`
- `adapters/postgresql/collation.test.ts`
- `adapters/postgresql/invertible-migration.test.ts`
- `adapters/postgresql/range.test.ts`
- `adapters/postgresql/schema.test.ts`
- `adapters/postgresql/uuid.test.ts`
- `adapters/postgresql/virtual-column.test.ts`
- `connection-adapters/abstract/schema-statements-on-adapter.test.ts`
- `invertible-migration.test.ts`
- `migration.test.ts`
- `query-cache.test.ts`
- `reserved-word.test.ts`
- `schema-dumper.test.ts`
- `schema-introspection.test.ts`
- `timestamp.test.ts`

The 3 `dropAllTables` files are the highest-value: replace the carpet-bomb
teardown with explicit `dropTable(name)` for each table the file creates (the rule
rejects `dropAllTables` as satisfying a create). The other 15 are migration/DDL
feature tests that create bespoke tables and currently leak them.

### Scope / splitting

18 files is more than one 500-LOC PR. **Do NOT fan out sibling PRs from this
story.** Claim it for the first bite-sized batch (e.g. the 3 `dropAllTables`
files, ~200 LOC), ship that, and register follow-on batches as additional stories
under this RFC via `pnpm tasks new 0019-canonical-schema-burndown <slug>` so each
gets its own owner/PR. Coordinate with the parallel `require-canonical-schema`
burndown where files overlap (e.g. `normalized-attribute`) to convert schema +
teardown together rather than touching the file twice.

`dropAllTables` itself remains the load-bearing global-isolation primitive
(`resetTestAdapterState`); this story removes only the **per-file** `dropAllTables`
call sites, not the helper.

## Acceptance criteria

- [ ] Each file converted gives every `createTable(name)` an explicit
      `dropTable(name)` (or rides canonical `TEST_SCHEMA` so it creates nothing
      bespoke); no per-file `dropAllTables()` remains in converted files
- [ ] Each converted file's entry is removed from
      `eslint/require-table-teardown-exclude.json`
- [ ] No new shared-DB flakes (run the touched files locally on all relevant
      adapters; do NOT run the full suite)
- [ ] Remaining files (not in this batch) registered as follow-on stories under
      this RFC; exclude list strictly shrinks
