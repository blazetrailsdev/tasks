---
title: "A pool-less adapter's first schema call re-enters NullPool#server_version and raises ThreadError"
status: ready
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7653, which closed
`nullpool-server-version-mutex-is-a-reentrant-monitor` by declaring `NullPool`'s
`@mutex` as ruby-compat's new non-reentrant `Mutex`
(`connection_pool.rb:26` is `Mutex.new`, and `vendor/ruby/thread_sync.c:350-352`
raises `ThreadError, "deadlock; recursive locking"` on recursive locking).

That is faithful, and it exposed a live re-entrancy the previous reentrant
`Monitor` had been silently absorbing. On a _pool-less adapter_ (one built
directly, so `pool` is a `NullPool`) the first schema call re-enters
`server_version` from inside its own memo fill:

```text
createTable                                    mysql/schema-statements.ts:197
  defaultRowFormat                             mysql/schema-statements.ts:277
    isRowFormatDynamicByDefault                mysql/schema-statements.ts:270
      isMariadb                                abstract-mysql-adapter.ts:232
        fullVersion -> databaseVersion         abstract-adapter.ts:1679
          NullPool#serverVersion               abstract/connection-pool.ts:98   <-- takes the Mutex
            getDatabaseVersion                 abstract-mysql-adapter.ts:1287
              getFullVersion -> anyRawConnection   abstract-adapter.ts:1975
                validRawConnection -> withRawConnection   abstract-adapter.ts:1980
                  (lazy connect)               abstract-adapter.ts:1046
                    attemptConfigureConnection abstract-adapter.ts:2130
                      configureConnection      abstract-adapter.ts:2012
                        checkVersion           abstract-mysql-adapter.ts:909
                          databaseVersion
                            NullPool#serverVersion  <-- ThreadError
```

`anyRawConnection` / `validRawConnection` (`abstract-adapter.ts:1975-1986`) are
line-for-line `abstract_adapter.rb:1089-1104`, and `configure_connection` calling
`check_version` is `abstract_adapter.rb:1212-1213`, so no single method here is
the divergence. MRI would raise on the same chain.

The divergence is the _entry order_. In Rails the first `database_version` read
always happens from inside `connect`, where `@raw_connection` is already assigned
(`connect` is synchronous), so the nested `any_raw_connection` returns it and
never re-enters. trails connects lazily, so the first read of `database_version`
is whatever schema call the caller made first, and the connect happens _inside_
the mutex.

Two call sites had to be worked around in #7653 rather than fixed:

- `sqlite3-adapter.database-version.trails.test.ts` — now calls `verifyBang()`
  before reading `databaseVersion`, so `configure_connection` has already run.
- `defaults.test.ts`'s `withMysqlNotNullTable` — now uses `establishConnection`
  (matching `defaults_test.rb:234-241`'s `using_strict`, which uses
  `establish_connection`; `PoolConfig` really does `include MonitorMixin`,
  `pool_config.rb:6`, so the pooled path re-enters legally).

Both are correct as tests, but they only move the callers off the path. A user
doing `new Mysql2Adapter(config)` followed by any schema call still raises
`ThreadError`, where Rails' equivalent works because it connected first.

## Converged shape

Make the version memo unreachable re-entrantly on the lazy-connect path, so the
trails entry order matches Rails' — the raw connection exists before anything
reads `database_version`. The likely shape is to warm the memo as part of
connect (the way `configure_connection` -> `check_version` already does in Rails)
rather than letting an arbitrary first schema call be the one that fills it, so
`getDatabaseVersion`'s `anyRawConnection` finds a connection instead of starting
one. `pg-configure-connection-prefills-version-memo` (#6237) did this for
PostgreSQL; mysql2 and sqlite3 have no equivalent.

Do _not_ solve this by making `NullPool`'s mutex reentrant again —
`connection_pool.rb:26` is `Mutex.new`, and that convergence is settled.

Note `server-version-barrier-takes-the-connection-lock-first` is blocked on an
adjacent lock-ordering chain (`abstract-adapter-lock-defaults-to-monitor-not-nulllock`
-> `synchronize-lock-barges-in-the-release-window` ->
`converge-acquire-connection-blocking-wait`); check whether this one wants the
same prerequisite before starting.

## Acceptance criteria

- [ ] A pool-less adapter (`new Mysql2Adapter(config)`, `new BetterSQLite3Adapter(config)`)
      can service a schema call as its first operation without raising
      `ThreadError: deadlock; recursive locking`.
- [ ] `NullPool`'s `_mutex` is still ruby-compat's non-reentrant `Mutex`
      (`connection_pool.rb:26`), and `PoolConfig` still uses `MonitorMixin`
      (`pool_config.rb:6`).
- [ ] The two #7653 workarounds are revisited: the `verifyBang()` in
      `sqlite3-adapter.database-version.trails.test.ts` is no longer load-bearing.
- [ ] SQLite, PostgreSQL and MariaDB lanes green.
