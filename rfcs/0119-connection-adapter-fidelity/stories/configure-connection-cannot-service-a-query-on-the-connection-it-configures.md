---
title: "configureConnection cannot service a query on the connection it is configuring"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter#getDatabaseVersion` cannot be converged onto Rails'
`query_value` form (`sqlite3_adapter.rb:476-478`) because trails' connect path
cannot service a query issued from inside `configureConnection`. This blocks
`sqlite-get-database-version-uses-query-value`, which was attempted in PR #7546
and reverted out of it after hanging the SQLite lane.

Rails:

```ruby
# activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:476-478
def get_database_version # :nodoc:
  SQLite3Adapter::Version.new(query_value("SELECT sqlite_version(*)", "SCHEMA"))
end
```

Attempting exactly that in trails hangs `base.test.ts`'s
`connection in local time` and `connection in utc time` for 30s each
(reproduced locally, traced with probes). The cycle:

- `PoolConfig.serverVersion`
  (`packages/activerecord/src/connection-adapters/pool-config.ts:81-89`) takes
  its monitor and calls `connection.getDatabaseVersion()`.
- That now issues a pooled, logged, lock-taking `queryValue`, which for a
  connection established mid-test via `establishConnection` never resolves.
- Meanwhile `checkVersion`
  (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:765`,
  reached from `configureConnection` at `abstract-adapter.ts:1973`) and
  `supportsVirtualColumns` (`sqlite3-adapter.ts:662`, via `tableInfo` at
  `:1288`) both re-enter `databaseVersion` behind that held monitor.

Rails has no such cycle for two reasons, both of which trails lacks:

- `get_database_version`'s `query_value` runs on the already-connected raw
  handle — `configure_connection` is invoked during `connect`, and the query
  inside it reuses that connection rather than re-entering connection setup.
- Ruby's `Monitor` is thread-reentrant
  (`vendor/ruby/ext/monitor/lib/monitor.rb:200`), so a nested `server_version`
  on the same thread passes straight through. trails' port
  (`packages/ruby-compat/src/monitor.ts:37-63`) is reentrant only within one
  AsyncContext, which a second connection's configure is not.

Verified this is NOT the async-connect deferral: better-sqlite3 is the
synchronous driver on this path, so `_asyncConnectPending` is false throughout
and `_doAsyncConnect` is never entered.

## Converged shape

`configureConnection` must be able to run a query on the connection it is
configuring, before it returns — the way Ruby does, where `check_version`'s
`query_value` goes straight to the open handle. Concretely that means the
version probe (and any other query `configure_connection` makes) resolves
against the raw connection already in hand rather than re-entering the
pool/lease/verify path, and `PoolConfig.serverVersion` does not hold its
monitor across work that can re-enter `databaseVersion`.

Once that holds, `sqlite-get-database-version-uses-query-value` unblocks and
its body becomes Rails' one line verbatim.

## Acceptance criteria

- [ ] A query issued from inside `configureConnection` resolves against the
      connection being configured, without deadlocking.
- [ ] `PoolConfig.serverVersion` no longer deadlocks when the version probe
      itself reaches `databaseVersion` (directly or via a `supports*()` reader).
- [ ] `base.test.ts`'s `connection in local time` / `connection in utc time`
      stay green with `getDatabaseVersion` written as
      `new Version(await this.queryValue("SELECT sqlite_version(*)", "SCHEMA"))`.
- [ ] `sqlite-get-database-version-uses-query-value` is unblocked.
