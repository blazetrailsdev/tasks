---
title: "structureDump/structureLoad branch to a trails-only in-memory path Rails does not have"
status: claimed
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-08-08T17:15:57Z"
assignee: "enroll-sqlite-rake-test-in-test-compare"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#structureDump` / `#structureLoad`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) shell out to the
`sqlite3` CLI as Rails does, but branch to a trails-only adapter path first:

    if (isInMemoryDatabase(this.resolveDbPath())) return this.inMemoryStructureDump(filename);
    if (isInMemoryDatabase(this.resolveDbPath())) return this.inMemoryStructureLoad(filename);

Rails has no such branch. `structure_dump` and `structure_load`
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:43-58`
and `:60-66`) shell out unconditionally, because Rails has no in-memory SQLite
lane — `arunit` is always file-backed.

The branch exists because an in-memory database belongs to the connection that
opened it, so there is no file for a child `sqlite3` process to attach:
`sqlite3 :memory: ".schema"` dumps a database the child just created and
immediately discards. PR #6231 first shipped the unconditional shell-out and
red `Trailties Tests` on exactly this
(`packages/trailties/src/commands/db.test.ts` — "db schema:dump --format=sql
works against ':memory:' sqlite by reusing the migration adapter"), which is
what the branch was added to fix.

`inMemoryStructureDump` also carries two query-level deviations that the CLI
path does not, both consequences of re-executing the dump as a script rather
than feeding it to the sqlite3 shell:

- Rails orders `ORDER BY tbl_name, type DESC, name`; the fallback orders by a
  bespoke `CASE type WHEN 'table' THEN 0 WHEN 'view' THEN 1 WHEN 'index' THEN 2
WHEN 'trigger' THEN 3 ELSE 4 END` first, because `db.exec` applies statements
  strictly in order where the shell resolves forward-referenced triggers lazily.
- Rails' `.schema --nosys` omits SQLite internals implicitly; the fallback adds
  `AND name NOT LIKE 'sqlite_%'` by hand, or it would emit reserved-name CREATE
  statements that fail on load.

So the structure.sql trails emits for an in-memory database is not
byte-comparable with the one Rails emits for the same schema.

## Converged shape

Delete `inMemoryStructureDump` / `inMemoryStructureLoad` and the
`isInMemoryDatabase` branch, so both methods shell out unconditionally as
`sqlite_database_tasks.rb:43-66` does. That requires the in-memory consumers to
stop asking a task class to dump a database no child process can see. Two
routes, both needing investigation before either is committed to:

- Have the in-memory path materialise the database to a temp file first
  (`VACUUM INTO`, supported since SQLite 3.27) and shell out against that file.
  This keeps one code path and one emitted format; cost is a temp file and a
  copy per dump.
- Retire the `sqlite3_mem` lane's use of these task methods entirely, so the
  in-memory case never reaches them. Note RFC 0029 (`sqlite-memory-fidelity`)
  is closed, so this is not covered there.

`VACUUM INTO` looks like the smaller of the two and keeps the lane intact.

## Acceptance criteria

- [ ] `structureDump` / `structureLoad` have no `isInMemoryDatabase` branch and
      shell out unconditionally, matching `sqlite_database_tasks.rb:43-66`.
- [ ] `inMemoryStructureDump` / `inMemoryStructureLoad` are deleted, taking the
      bespoke `CASE type ...` ordering and the `sqlite_%` filter with them.
- [ ] An in-memory dump and a file-backed dump of the same schema produce the
      same bytes.
- [ ] `packages/trailties/src/commands/db.test.ts`'s "db schema:dump
      --format=sql works against ':memory:' sqlite" still passes — it is the
      test that caught the unconditional shell-out in #6231.
- [ ] The two in-memory tests in `sqlite-database-tasks.test.ts` still pass or
      are replaced by equivalents on the converged path.
- [ ] Green on sqlite (file lane) and `sqlite3_mem`.
