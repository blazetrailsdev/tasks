---
title: "Scheduler fails to register with SQLITE_BUSY on a file SQLite queue database"
status: in-progress
updated: 2026-10-30
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9490
claim: "2026-10-30T14:22:41Z"
assignee: "scheduler-registers-on-file-sqlite-queue"
blocked-by: null
closed-reason: null
---

With the schema preloaded, a real supervisor on a SQLite `queue` database
(`timeout: 5000`, WAL) registers Supervisor, Dispatcher and Worker, but the
Scheduler fails every time:
`Error registering Scheduler ... ActiveRecord::StatementTimeout SQLite3::BusyException: database is locked`
after the full 5s busy timeout. No other process was holding the file. Cause not
yet found; better-sqlite3's synchronous busy wait inside one event loop, with a
transaction open on another connection, is the first suspect. Rails' default
Solid Queue setup is this same SQLite shape. Found by trailmap.

## Acceptance

- Reproduce with `bin/jobs`-style supervisor on a file SQLite queue database; the scheduler registers and enqueues a recurring task, with a test.
