---
title: "Burn down require-table-teardown: migration/DDL feature tests (invertible-migration, migration, query-cache, reserved-word, schema-dumper, schema-introspection, timestamp)"
status: ready
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The `require-table-teardown` ESLint rule (`eslint/require-table-teardown.mjs`)
demands that every `createTable("foo", …)` in an activerecord test file be
balanced by an explicit `dropTable("foo")` in the same file — by name, not via
`dropAllTables()` (the carpet bomb is itself flagged). Unbalanced creates leak
tables into the shared per-worker DB and produce the catalogued shared-table
flakes. 15 files sit on the exclude baseline
(`eslint/require-table-teardown-exclude.json`); this story owns the 7
**core migration/DDL feature** files:

- `packages/activerecord/src/invertible-migration.test.ts`
- `packages/activerecord/src/migration.test.ts`
- `packages/activerecord/src/query-cache.test.ts`
- `packages/activerecord/src/reserved-word.test.ts`
- `packages/activerecord/src/schema-dumper.test.ts`
- `packages/activerecord/src/schema-introspection.test.ts`
- `packages/activerecord/src/timestamp.test.ts`

(Sibling stories own the 6 `adapters/postgresql/*` files and the
abstract-mysql/schema-statements pair — non-overlapping file sets, can run in
parallel.)

Approach per file, in fidelity order (see RFC 0019 + the memory-noted
preference for Rails-fidelity over boilerplate):

1. If the table the test creates mirrors a canonical `schema.rb` table, ride
   the canonical TEST_SCHEMA table instead of creating a bespoke one (deletes
   the create AND the teardown problem).
2. If the table is genuinely bespoke (migration tests legitimately create
   ad-hoc tables — Rails' `migration_test.rb` does too), add the
   per-name `dropTable` in the same hook structure Rails uses (`teardown` →
   `afterEach`/`afterAll`).
3. Names built by interpolation are invisible to the rule — don't contort the
   test to satisfy it; the rule already skips them.

Then remove the file from `require-table-teardown-exclude.json` so the ratchet
holds. Note `migration.test.ts` is large; if it alone overflows ~500 LOC of
diff, ship the other six here and register a continuation story for it.

## Acceptance criteria

- [ ] The 7 files are removed from `eslint/require-table-teardown-exclude.json`
      and `pnpm lint` passes (no `eslint-disable` escapes).
- [ ] No `dropAllTables()` added; each created table is dropped by name, or the
      create is replaced by a canonical TEST_SCHEMA table.
- [ ] Touched test files pass locally on SQLite (`pnpm vitest run <file>`); no
      test renames; no full-suite run.
- [ ] If split, the continuation story is registered via `pnpm tasks new`
      rather than a sibling PR.
