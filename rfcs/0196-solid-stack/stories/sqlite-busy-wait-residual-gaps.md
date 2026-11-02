---
title: "SQLite batches, deadlocks and retries match Rails' busy handling on one event loop"
status: done
updated: 2026-11-01
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9582
claim: "2026-11-01T18:41:29Z"
assignee: "limits-concurrency-typed-on-activejob-base"
blocked-by: null
closed-reason: null
---

Residual gaps left by the yielding busy wait (trails#9490). Rails and sqlite3-ruby have none of them.

- `execBatch`: a multi-statement batch still blocks the event loop, because the driver's `exec` is opaque and a retry would replay finished statements. Fix needs a statement-level split that handles triggers and string literals.
- `retryBusy`: a deadlock raises at the deadline rather than immediately, because the driver reports the same SQLITE_BUSY.
- The `retries` arm and configs with no `timeout` keep the driver's blocking default.

Done when each case behaves as Rails does on one event loop, with a test.
