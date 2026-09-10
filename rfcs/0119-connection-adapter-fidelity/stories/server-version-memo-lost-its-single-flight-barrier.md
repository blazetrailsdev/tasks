---
title: "server-version-memo-lost-its-single-flight-barrier"
status: done
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7622
claim: "2026-09-08T16:16:53Z"
assignee: "server-version-memo-lost-its-single-flight-barrier"
blocked-by: null
closed-reason: null
---

## Context

`PoolConfig#server_version` (`activerecord/lib/active_record/connection_adapters/pool_config.rb:39-40`)
and `NullPool#server_version` (`abstract/connection_pool.rb:30-31`) memoize the
probe behind a barrier — a reentrant `Monitor` in the first, a `Mutex` in the
second:

```ruby
@server_version || synchronize { @server_version ||= connection.get_database_version }
```

PR #7592 dropped both barriers (keeping the memo) because trails' probe is
`await`ed where Ruby's is a straight call, and the barrier then deadlocks. The
cycle, traced on `base.test.ts`'s `connection in local time` with
`get_database_version` written Rails' way:

- Flow A: `supportsVirtualColumns` -> `databaseVersion` -> `serverVersion` takes
  the barrier and awaits the probe; the probe's `queryValue` goes through
  `withRawConnection`, which takes the adapter's own lock.
- Flow B: holds that adapter lock (a connect, a pinned fixture connection) and
  reaches `databaseVersion` -> `serverVersion`, blocking on the barrier A holds.

A needs B's lock, B needs A's barrier. Ruby never assembles this: its probe runs
synchronously on the calling thread, so either the Monitor is reentrant on that
same thread or the re-entry never happens at all (`@raw_connection` is installed
before `configure_connection` runs, so the nested `query_value` does not
re-enter connect).

Single-flight was tried and is strictly worse: memoizing the in-flight promise
makes the re-entrant caller await its own probe.

**Cost of the current state:** two genuinely concurrent first callers each issue
a `get_database_version` instead of one. The memo is idempotent so the value is
the same, but the duplicate probe is a real divergence from Rails and it has no
call-site receipt — `parity:api:calls` reports a `@missingRailsCall synchronize`
tag on either body as STALE (neither `server_version` pair is in the compared
call set), and `blazetrails/no-freeform-comments` strips prose. This story is
the register entry.

## Acceptance criteria

- [ ] Single-flight is restored without reintroducing the A/B lock inversion —
      e.g. the version probe stops taking the adapter lock (it runs on the raw
      connection in hand, per `sqlite3_adapter.rb:476-478` reached from
      `configure_connection`), after which the barrier can come back verbatim.
- [ ] The regression cover in
      `sqlite3-adapter.database-version.trails.test.ts`
      (`a query issued from configureConnection runs on the connection being
configured`) stays green, and a new arm pins that two concurrent first
      callers issue ONE `getDatabaseVersion`.
- [ ] Or the deviation is ratified with a receipt the tooling accepts, rather
      than left unregistered.
