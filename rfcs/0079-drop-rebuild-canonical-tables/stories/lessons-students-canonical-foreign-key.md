---
title: "lessons-students-canonical-foreign-key"
status: done
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7129
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #7120 (`shield-removal-mysql-adapter-suites`).

`vendor/rails/activerecord/test/schema/schema.rb:726` lays a permanent
foreign key as part of the canonical schema:

```ruby
add_foreign_key :lessons_students, :students, on_delete: :cascade, deferrable: :immediate
```

trails' canonical schema declares the two tables
(`packages/activerecord/src/support/canonical-schema.ts:1074` and the
`students` block below it; `test-helpers/test-schema.ts:959-977`) but **not
the foreign key**. `TEST_SCHEMA` has no `foreignKeys:` entry for
`lessons_students` at all.

The one test that reads it — Rails'
`test_foreign_keys_method_with_ansi_quotes`
(`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/schema_test.rb:125-128`)
— does **no DDL**: it just calls `@connection.foreign_keys("lessons_students")`
and asserts the one row. Because trails' canonical schema is missing the FK,
the port
(`packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts`,
`"foreign keys method with ansi quotes"`) has to `addForeignKey(...)` before
the assertion and `removeForeignKey(...)` in a `finally`.

PR #7120 already removed the two canonical `createTable`/`dropTable` pairs
that suite carried (`posts`, `topics`) plus its `rebuildCanonicalTables`
restore helper. This add/remove-in-test pair is the last mutate-and-restore
shape left in that file, and it exists only because the canonical schema is
one row short of `schema.rb`.

Note the second, smaller deviation: Rails' FK carries
`deferrable: :immediate`, which the test's `addForeignKey` call does not
pass.

## Why this is not a one-line change

`packages/activerecord/src/support/canonical-table-rebuild-bulk-inbound-fk.trails.test.ts`
clears every `lessons_students` foreign key in `clearLessonsStudentsForeignKeys()`
(`:72-76`) and asserts `expect(await adapter.foreignKeys("lessons_students")).toEqual([])`
(`:37`) after a `rebuildCanonicalTables(adapter, ["authors"])`. That test is
about a rebuild dropping an _inbound_ FK; once the canonical schema lays a
real FK on that table, its setup and its `toEqual([])` need reworking (and its
`finally` needs to restore the canonical FK rather than leave the table bare).

There is also live blast radius to check: with the constraint in place, any
suite inserting `lessons_students` rows whose `student_id` does not exist
starts failing on PG/MySQL. `has-many-through-associations.test.ts` is the
main consumer.

## Acceptance criteria

- [ ] `canonical-schema.ts` and `test-helpers/test-schema.ts` lay
      `add_foreign_key :lessons_students, :students, on_delete: :cascade,
deferrable: :immediate`, mirroring `schema.rb:726`.
- [ ] `"foreign keys method with ansi quotes"` reverts to a bare read, with no
      `addForeignKey`/`removeForeignKey` around it — matching
      `schema_test.rb:125-128`.
- [ ] `canonical-table-rebuild-bulk-inbound-fk.trails.test.ts` is reworked
      against the now-canonical FK and stays green on PG and MySQL/MariaDB.
- [ ] `pnpm parity:schema` clean; AR suites green on all three adapter lanes.
- [ ] No test renames; `parity:test` delta non-negative.
