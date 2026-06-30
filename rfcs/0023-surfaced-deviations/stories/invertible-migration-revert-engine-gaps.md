---
title: "invertible-migration-revert-engine-gaps"
status: ready
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting `packages/activerecord/src/invertible-migration.test.ts`
to a faithful mirror of `vendor/rails/activerecord/test/cases/invertible_migration_test.rb`
(RFC 0048 convergence). The faithful port exposed migration-engine gaps where
trails' behavior diverges from Rails. The affected cases are marked
`it.skip` / `it.skipIf` in the ported file as tracked-pending-convergence and
must be un-skipped once the impl is converged.

Gaps (each with the Rails test name to un-skip):

1. **revert(fn) is not direction-aware** — `Migration#revert(fn)` always
   reverses the recorded ops regardless of the migration's own up/down
   direction, and `_reverseOperation` throws `IrreversibleMigration` for
   `dropTable`. Rails' CommandRecorder threads direction so a migration that
   `revert`s a `create_table` block recreates on down.
   Un-skip: `migrate revert`, `migrate revert by part`,
   `migrate revert whole migration`, `migrate nested revert whole migration`.
   See `migration.ts` `revert()` (~1223) and `_reverseOperation` (~360).

2. **changeTable `removeIndex` records no column info** — the migrate reverse
   path throws "Cannot reverse removeIndex without column info" because the
   change-table builder's `removeIndex(columns)` doesn't record `column`.
   Un-skip: `exception on removing index without column option`.

3. **drop_table block for reversibility** — `Migration#dropTable` takes no
   block (table definition); Rails' `drop_table("horses") { |t| ... }` is
   reversible via the block. `_reverseOperation` "dropTable" throws.
   Un-skip: `migrate revert drop table`.

4. **CommandRecorder#commands lacks the block triple** — Rails asserts
   `[[:create_table, ["apples"], block], ...]`; the trails recorder records
   `{cmd, args}` without the block. `test_revert_order` needs block-tracking.
   Un-skip: `revert order`.

5. **Model default not seeded into new instances** — `new Horse().readAttribute("name")`
   returns null after a `change_column_default` migration where Rails'
   `Horse.new.name` returns the column default. Related to the restricted-`name`
   attribute / default-seeding gap.
   Un-skip: `migrate revert change column default`.

6. **SQLite addForeignKey via ALTER ADD CONSTRAINT** — the SQLite adapter emits
   `ALTER TABLE ... ADD CONSTRAINT` which SQLite rejects (needs table
   recreation). PG/MySQL run the test.
   Un-skip (SQLite lane): `migrate revert add foreign key with invalid option`.

## Acceptance criteria

- [ ] Converge each gap above to Rails behavior in `migration.ts` /
      `migration/command-recorder.ts` / the SQLite adapter.
- [ ] Un-skip the listed cases in `invertible-migration.test.ts` and confirm
      they pass on every adapter lane (respecting Rails' own feature gates).
- [ ] No regression in `migration.test.ts` / the migrator suites.
