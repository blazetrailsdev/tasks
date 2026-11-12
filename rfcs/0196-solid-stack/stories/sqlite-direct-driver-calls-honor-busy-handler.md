---
title: "SQLite adapter's direct driver calls honor the busy handler"
status: done
updated: 2026-11-12
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 14
pr: trails#10012
claim: "2026-11-12T00:11:34Z"
assignee: "solid-queue-recurring-enqueue-event-flake"
blocked-by: null
closed-reason: null
---

## Context

sqlite3-ruby's `busy_handler` (lib/sqlite3/database.rb:692-705) covers every statement on the handle. In trails `busyHandler` is read only by `retryBusy` (packages/activerecord/src/sqlite/busy-wait.ts), reached from `performQuery`, `execBatch` and the pragma loop in `configureConnection`. Direct driver calls, such as `rawConnection.pragma("encoding")` (connection-adapters/sqlite3-adapter.ts:379) and `rawConnection.rollback()` in `reconnect`, raise at once under `timeout:` where Rails waits.

## Acceptance criteria

- Every raw-connection call the adapter makes outside `performQuery` goes through `retryBusy`, or moves onto `performQuery`.
- A test holds a lock across one such call under `timeout:` and it waits.
- The "a direct driver call elsewhere does not wait" sentence in packages/activerecord/CLAUDE.md is removed.
