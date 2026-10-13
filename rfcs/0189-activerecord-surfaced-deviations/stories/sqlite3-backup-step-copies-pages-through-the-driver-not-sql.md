---
title: "activerecord: SQLite3::Backup#step copies pages through the driver's backup API instead of replaying SQL"
status: draft
updated: 2026-10-13
rfc: "0189-activerecord-surfaced-deviations"
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

trails#8874 added `packages/activerecord/src/sqlite/backup.ts`, a port of
`SQLite3::Backup` (`vendor/sqlite3/v2.6.0/ext/sqlite3/backup.c`). The gem's
`initialize` (`backup.c:75-102`) calls `sqlite3_backup_init` between two open
handles and `step` (`:112-125`) is `sqlite3_backup_step(ctx->p, NUM2INT(nPage))`.
The trails `step` instead copies in SQL through the destination handle: it
`ATTACH`es the file behind `srcname`, replays `sqlite_master`, and runs one
`INSERT ... SELECT` per table, with `foreign_keys` switched off for the copy.
The reason was that better-sqlite3's `db.backup(destinationFile)` and
`node:sqlite`'s `backup(sourceDb, path)` take a destination path, not a handle.

What that leaves different from the gem:

- `nPage` is ignored; every `step` copies everything and answers `DONE`.
- `remaining` and `pagecount` (`backup.c:144-170`) are not ported.
- The source must be file-backed; the gem's own test
  (`vendor/sqlite3/v2.6.0/test/test_backup.rb:6-14`) backs up `:memory:` to `:memory:`.
- `dstname` other than `"main"` raises `SQLite3::Exception`, an arm the gem lacks.
- Virtual tables are not handled (their shadow tables are created twice).
- The copy appends to the destination instead of replacing its pages.
- The test setup in `packages/activerecord/src/tasks/database-tasks.test.ts`
  spells `SQLite3::Database.new file` (`database_tasks_test.rb:1040`) as
  `betterSqlite3Driver.open({ database: file })`.

Not checked in that PR: expo-sqlite's handle-to-handle backup call, and
better-sqlite3's `serialize()` (already used in `sqlite/better-sqlite3.ts`
`openDatabase`) as a route to a page-level copy.

## Acceptance criteria

- [ ] `Backup#step` copies pages through a driver's own backup API on each
      wrapper that has one, honouring `nPage`, with `remaining` and `pagecount`
      ported; a wrapper with no such API is named with the missing call.
- [ ] `test_backup_step` and `test_backup_all` from `test_backup.rb` are ported
      under their names, on a `:memory:` source where the driver allows.
- [ ] The `dstname !== "main"` raise and the file-backed-source raise are gone
      wherever the page copy is used.
