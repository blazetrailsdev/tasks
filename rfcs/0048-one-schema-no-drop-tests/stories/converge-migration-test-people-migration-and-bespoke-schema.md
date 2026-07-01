---
title: "converge-migration-test-people-migration-and-bespoke-schema"
status: done
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4370
claim: "2026-07-01T13:24:53Z"
assignee: "converge-migration-test-people-migration-and-bespoke-schema"
blocked-by: null
---

## Context

Residual surfaced by the `fidelity-audit-canonical-scratch-and-bespoke-tables`
audit. `converge-migration-test-columnshash-stubs` (#4353, done) and the other
migration convergence stories left `packages/activerecord/src/migration.test.ts`
with two still-divergent patterns that violate Rails fidelity and the
`defineSchema` canonical-only rule:

1. **Local bespoke `TEST_SCHEMA` shadowing canonical** — `migration.test.ts:47-58`
   declares `const TEST_SCHEMA = { people: { name }, posts: { title }, events: { name } }`
   and feeds it to `defineSchema(adapter, TEST_SCHEMA)` in `freshAdapterWithSchema()`
   (called by `instance based migration up`/`down` :325/:340 and `name collision
across dbs` :546). These are fabricated shapes of canonical tables — canonical
   `events` (`test-helpers/test-schema.ts`) has only `title` (limit 5) and NO
   `name` column, so `events: { name }` and the `Event` model with a `name`
   attribute are pure stubs.

2. **Fake-shape canonical `users` scratch standing in for Rails' migration-on-
   `people` tests.** Rails `vendor/rails/activerecord/test/cases/migration_test.rb`
   runs these via `Migrator` with `add_column/remove_column "people","last_name"`
   and rolls back in an `ensure` (`Person.reset_column_information` +
   `remove_column`). trails instead does `createTable("users", …)` + direct
   `addColumn/removeColumn` on a bespoke-shaped `users` table:
   - `add column with if not exists not set` (:131) — rb `test_add_column_with_if_not_exists_not_set` (people migrations)
   - `add column with if not exists set to true` (:223) — rb :361 (people)
   - `remove column with if not exists not set` (:454) — rb :243 (people migrations a/b/c)
   - `remove column with if exists set` (:669) — rb `test_remove_column_with_if_exists_set` :296
   - `add column with casted type if not exists set to true` (:678) — rb :389 (people)
   - `add column with if not exists set to true does not raise if type is different` (:687) — rb :419 (people)
   - `IndexForTableWithSchemaMigrationTest > add and remove index` (:161) — rb migration/index_test.rb uses `:testings`
     Plus the `afterAll` teardown (`migration.test.ts:73/92/99`) `dropTable`s
     canonical `articles`/`products`/`users`.

## Acceptance criteria

- [ ] Replace the local bespoke `TEST_SCHEMA` with canonical `TEST_SCHEMA` (or a
      canonical subset / fixtures); no fabricated shapes of `people`/`posts`/`events`.
- [ ] `instance based migration up`/`down` stop relying on a fabricated
      `events: { name }`; ride the canonical `events` shape or Rails' actual table.
- [ ] The add/remove-column `if_not_exists` tests are faithful word-for-word ports
      of their `migration_test.rb` counterparts: run `Migrator` with
      `add_column/remove_column "people","last_name"` and reset column info in a
      finally, riding canonical `people` — no `createTable("users", …)` stub.
- [ ] `IndexForTableWithSchemaMigrationTest > add and remove index` uses Rails'
      `:testings` scratch table, not canonical `users`.
- [ ] No `createTable`/`dropTable` in `migration.test.ts` targets a name in the
      canonical `TEST_SCHEMA`; the `afterAll` teardown drops no canonical names.
- [ ] Test names unchanged; `test:compare` does not regress. Under the 500-LOC
      ceiling; single PR from `main`.
