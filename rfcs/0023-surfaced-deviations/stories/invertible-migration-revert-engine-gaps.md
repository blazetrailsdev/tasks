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

The ported file landed in PR #4328. Seven gaps remain `it.skip`
tracked-pending-convergence (the `change_column_default` case was converged in
that PR and now runs live, so it is NOT listed here). Each gap below names the
exact Rails test(s) to un-skip once the impl is converged:

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

5. **Column comments don't round-trip** — the inline `comment:` column option /
   `changeColumnComment` is not reflected back through `columns()`, so
   `columnsHash["name"].comment` stays `null` on PG/MariaDB (table comments DO
   work). Restore the `comments` feature gate when un-skipping.
   Un-skip: `migrate revert change column comment`.

6. **`change_table` `t.references` reversal + SQLite `removeColumn` index drop** —
   the CommandRecorder change_table proxy (`RecorderTableProxy`) has no
   `references`/`belongsTo`, so reverting `t.references` throws; and SQLite's
   `removeColumn` table-rebuild can't drop a column an index still references
   (`error in index ... after drop column`). Add `references`/`belongsTo` to the
   recorder proxy and make the SQLite rebuild skip indexes on removed columns.
   Un-skip: `migrations can handle foreign keys to specific tables`.

7. **addForeignKey invalid-option reversal diverges on every adapter** — SQLite
   emits `ALTER TABLE ... ADD CONSTRAINT` (rejected; needs table recreation),
   and on PG/MariaDB the reverse names the constraint `fk_horses_parent_id`,
   which does not match the hashed name `addForeignKey` created.
   Un-skip: `migrate revert add foreign key with invalid option`.

## Acceptance criteria

- [ ] Converge each gap above to Rails behavior in `migration.ts` /
      `migration/command-recorder.ts` / the SQLite + PG/MySQL adapters.
- [ ] Un-skip the listed cases in `invertible-migration.test.ts` and confirm
      they pass on every adapter lane (respecting Rails' own feature gates;
      restore the `comments` gate on the column-comment case).
- [ ] No regression in `migration.test.ts` / the migrator suites.
