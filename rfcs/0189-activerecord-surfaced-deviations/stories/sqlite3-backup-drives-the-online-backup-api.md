---
title: "sqlite3: SQLite3::Backup drives SQLite's online-backup API as backup.c does"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/sqlite3/lib/backup.ts` (moved from activerecord by trails#10422) stands in for the gem's C class
`SQLite3::Backup` (`vendor/sqlite3/v2.6.0/ext/sqlite3/backup.c:180-187`). The gem class is a thin wrapper
over SQLite's online-backup API:

- `initialize(dstdb, dstname, srcdb, srcname)` calls `sqlite3_backup_init` (`backup.c:92`) for any
  destination name;
- `step(nPage)` calls `sqlite3_backup_step(pBackup, nPage)` and answers its status code;
- `finish` calls `sqlite3_backup_finish`;
- `remaining` and `pagecount` read `sqlite3_backup_remaining` / `sqlite3_backup_pagecount`.

The trails class deviates:

- it ATTACHes the source file and replays `sqlite_master` DDL plus an `INSERT … SELECT` per table, so
  it cannot back up an in-memory source ("needs a file-backed source database");
- `step(nPage)` ignores `nPage` and copies everything in one call, always answering `DONE`;
- it raises for any `dstname` other than `"main"`;
- `remaining` and `pagecount` are not ported.

better-sqlite3 exposes `db.backup()`, and libsql and node:sqlite expose equivalents, so each engine can
drive the real page-level API.

## Acceptance criteria

- [ ] `Backup` drives the engine's online-backup primitive and honours `nPage`. `step` answers `OK` while
      pages remain and `DONE` at the end, as `sqlite3_backup_step` does.
- [ ] `remaining` and `pagecount` are ported under their gem names.
- [ ] Any `dstname` is accepted where the engine supports it; an engine without the primitive raises the
      gem's `SQLite3::Exception` at the call site, with the receipt naming the engine story.
- [ ] `packages/sqlite3/test/backup.trails.test.ts` covers a multi-step backup and an in-memory source.
