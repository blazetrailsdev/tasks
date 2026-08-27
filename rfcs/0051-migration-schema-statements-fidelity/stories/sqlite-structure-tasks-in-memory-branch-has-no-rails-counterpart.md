---
title: "structureDump branches to a trails-only in-memory path Rails does not have"
status: done
updated: 2026-08-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7127
claim: "2026-08-27T18:13:52Z"
assignee: "group-model-ts-remaining-inline-mixin-literals-into-module-objects"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#structureDump`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts:137`) shells out to
the `sqlite3` CLI as Rails does, but branches to a trails-only adapter path
first:

    if (isInMemoryDatabase(this.dbConfig.database as string))
      return this.inMemoryStructureDump(filename);   // :141-142

Rails has no such branch. `structure_dump`
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:44-58`)
shells out unconditionally, because Rails has no in-memory SQLite lane —
`arunit` is always file-backed.

The branch exists because an in-memory database belongs to the connection that
opened it, so there is no file for a child `sqlite3` process to attach:
`sqlite3 :memory: ".schema"` dumps a database the child just created and
immediately discards. PR #6231 first shipped the unconditional shell-out and
red `Trailties Tests` on exactly this
(`packages/trailties/src/commands/db.test.ts` — "db schema:dump --format=sql
works against ':memory:' sqlite by reusing the migration adapter"), which is
what the branch was added to fix.

`inMemoryStructureDump` (`:206`) also carries two query-level deviations the
CLI path does not, both consequences of re-executing the dump as a script
rather than feeding it to the sqlite3 shell:

- Rails orders `ORDER BY tbl_name, type DESC, name`; the fallback orders by a
  bespoke `CASE type WHEN 'table' THEN 0 WHEN 'view' THEN 1 WHEN 'index' THEN 2
WHEN 'trigger' THEN 3 ELSE 4 END` first, because `db.exec` applies statements
  strictly in order where the shell resolves forward-referenced triggers lazily.
- Rails' `.schema --nosys` omits SQLite internals implicitly; the fallback adds
  `AND name NOT LIKE 'sqlite_%'` by hand, or it would emit reserved-name CREATE
  statements that fail on load.

So the structure.sql trails emits for an in-memory database is not
byte-comparable with the one Rails emits for the same schema.

**Respec, 2026-08-26.** This story originally covered `structureLoad` as well
and was blocked because neither route in its body could converge both halves.
`VACUUM INTO` converges the dump and only the dump: it materialises a readable
file, but SQLite has no inverse — there is no way to pull a file's schema back
into the live in-memory connection that owns the database, so the adapter exec
`inMemoryStructureLoad` performs is the only mechanism available. Converging
the load half therefore needs a product decision about what
`db schema:load --format=sql` means for a `:memory:` config, which is filed
separately as `sqlite-structure-load-in-memory-lane-decision`. This story is
now the dump half, which is unblocked and shippable on its own.

## Converged shape

Delete `inMemoryStructureDump` and the `isInMemoryDatabase` branch at `:141`,
so `structureDump` shells out unconditionally as
`sqlite_database_tasks.rb:44-58` does. The in-memory case materialises the
database to a temp file with `VACUUM INTO` (SQLite 3.27+) and shells out
against that file, so there is one code path and one emitted format. Cost is a
temp file and a copy per dump; delete it after the dump.

`structureLoad` (`:172`) and `inMemoryStructureLoad` (`:247`) are explicitly
out of scope and stay exactly as they are — do not touch them, and do not
delete `isInMemoryDatabase`'s import, which the load branch at `:173` still
needs.

## Acceptance criteria

- [ ] `structureDump` has no `isInMemoryDatabase` branch and shells out
      unconditionally, matching `sqlite_database_tasks.rb:44-58`.
- [ ] `inMemoryStructureDump` is deleted, taking the bespoke `CASE type ...`
      ordering and the `sqlite_%` filter with it.
- [ ] An in-memory dump and a file-backed dump of the same schema produce the
      same bytes.
- [ ] `packages/trailties/src/commands/db.test.ts`'s "db schema:dump
      --format=sql works against ':memory:' sqlite" still passes — it is the
      test that caught the unconditional shell-out in #6231.
- [ ] The in-memory _dump_ test in `sqlite-database-tasks.test.ts` still passes
      or is replaced by an equivalent on the converged path. The in-memory
      _load_ test is untouched.
- [ ] The temp file is removed after the dump, including on failure.
- [ ] Green on sqlite (file lane) and `sqlite3_mem`.
