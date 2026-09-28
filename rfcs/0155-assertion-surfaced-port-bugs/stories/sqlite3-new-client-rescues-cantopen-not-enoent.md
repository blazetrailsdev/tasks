---
title: "sqlite3-new-client-rescues-cantopen-not-enoent"
status: draft
updated: 2026-09-28
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter.new_client` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:34-42`)
rescues only `Errno::ENOENT`, and raises `NoDatabaseError` when its message
includes "No such file or directory". Any other error is re-raised.

trails' `SQLite3Adapter.newClient` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`,
the `rescue` closure) rescues `CantOpenException` instead. It also has an
invented second arm, `|| !File.isExist(String(config.database))`, which turns
a readonly open of a missing file into `NoDatabaseError`. Rails raises
`SQLite3::CantOpenException` in that case. The trails-only test
`raises NoDatabaseError opening a missing database file readonly`
(`sqlite3-adapter.trails.test.ts`) pins the invented arm.

Since trails#8231, the drivers raise the gem's `SQLite3::*` classes, so the
error that escapes is now the same one the gem would raise.

## Acceptance criteria

- [ ] Work out where (if anywhere) a trails driver open raises the analogue of
      `Errno::ENOENT` (for example, a missing parent directory), and rescue that,
      as Rails does.
- [ ] Drop the `!File.isExist` arm, or show from vendor/sqlite3 that the gem
      maps that case to ENOENT.
- [ ] Reconcile the trails-only readonly-missing-file test with Rails' behaviour.
