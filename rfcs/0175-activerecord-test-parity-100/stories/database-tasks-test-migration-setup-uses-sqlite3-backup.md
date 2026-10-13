---
title: "activerecord: DatabaseTasksMigrationTestCase copies the file database with a ported SQLite3::Backup"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasksMigrationTestCase`'s setup
(`vendor/rails/v8.0.2/activerecord/test/cases/tasks/database_tasks_test.rb:1035-1045`)
copies the file database into the `:memory:` connection it just established:

    source_db = SQLite3::Database.new file
    dest_db = ActiveRecord::Base.lease_connection.raw_connection
    backup = SQLite3::Backup.new(dest_db, "main", source_db, "main")
    backup.step(-1)
    backup.finish

`packages/activerecord/src/tasks/database-tasks.test.ts` still does that copy with the
hand-written `backupIntoConnection` helper: an `ATTACH DATABASE`, a replay of
`sqlite_master`, and one `INSERT ... SELECT` per table. `database-tasks-test-migration-and-version-bodies-match-rails`
ported every other part of that test case and left this one, because no trails driver
wrapper can back up into an open handle: `packages/activerecord/src/sqlite/better-sqlite3.ts`,
`node-sqlite.ts` and `libsql.ts` each expose a file-to-file `backup` only, and the
underlying drivers (`better-sqlite3`'s `db.backup(destinationFile)`, `node:sqlite`'s
`backup(sourceDb, path)`) take a destination path, not a destination handle.

The same setup also reads the source path from `ambientPoolConfiguration().database`
where Rails reads `ActiveRecord::Base.lease_connection.raw_connection.filename`, and
spreads the ambient configuration plus `pool: 1` where Rails passes
`adapter: "sqlite3", database: ":memory:", migrations_paths: migrations_path`.

## Acceptance criteria

- [ ] A `SQLite3::Backup` port (`new(dstdb, dstname, srcdb, srcname)`, `step`, `finish`,
      per `vendor/sqlite3/v2.6.0/ext/sqlite3/backup.c`) exists over each trails SQLite driver
      wrapper that can support it, or the wrappers that cannot are named with the driver
      limit that blocks them.
- [ ] `backupIntoConnection` is deleted and the setup is Rails' five lines.
- [ ] The source path is `rawConnection.filename` and the `establishConnection` hash is
      Rails' three keys, or each remaining difference is receipted at the call site.
- [ ] Test names unchanged; `pnpm parity:test:assertions` stays green.
