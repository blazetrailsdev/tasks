---
title: "pg-configure-connection-never-calls-check-version"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6224
claim: "2026-08-08T10:15:57Z"
assignee: "pg-configure-connection-never-calls-check-version"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while reviewing PR #6149 (`database-version-sync-getter-forces-hand-warms`),
which made the pool version memo warm by construction on connection
establishment. Tracing PG's override chain turned up a pre-existing gap that PR
did not introduce and left alone.

Rails' `PostgreSQLAdapter#configure_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:956-957`)
opens with `super`, and `AbstractAdapter#configure_connection`
(`abstract_adapter.rb:1212-1214`) is `check_version`. PG overrides
`check_version` (`postgresql_adapter.rb:669`) to floor-check the server at
`>= 9.3` and raise `DatabaseVersionError` otherwise.

trails' `PostgreSQLAdapter` never calls `checkVersion()` at all. Its
`configureConnection(client?)` delegates to the private
`_maybeConfigureConnection` (`postgresql-adapter.ts:769`), which never calls
`super.configureConnection()` and never calls `this.checkVersion()` — grep the
file, there is no call site. **The PG version floor check effectively does not
exist in trails.** Confirmed pre-existing on `main` via
`git show origin/main:packages/activerecord/src/connection-adapters/postgresql-adapter.ts`.

The blocker that used to justify it is gone: PR #6149 fills `_databaseVersion`
at the top of `_maybeConfigureConnection`, exactly where Rails' `super` sits, so
by the time the rest of the body runs the version is readable synchronously —
which is precisely what `checkVersion()` needs. The call is now free to add.

## Acceptance criteria

- [ ] `PostgreSQLAdapter#_maybeConfigureConnection` calls `this.checkVersion()`
      at the position Rails' `super` occupies (`postgresql_adapter.rb:957`),
      i.e. immediately after the memo fill PR #6149 added.
- [ ] `PostgreSQLAdapter#checkVersion` is ported per
      `postgresql_adapter.rb:669` — same floor (`9.3`), same error class, same
      message string — if it is missing or divergent.
- [ ] A test pins that a below-floor server version raises, in the shape Rails'
      own version-floor tests use (`AbstractMysqlAdapter#checkVersion` and its
      trails coverage are the local precedent).
- [ ] The PG lane stays green: the check must not fire on the supported server
      versions CI runs, and must not re-enter the connect path — the memo is
      already filled by the line above it, so `checkVersion()` is a plain sync
      memo read.
