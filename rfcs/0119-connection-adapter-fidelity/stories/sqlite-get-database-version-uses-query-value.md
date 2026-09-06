---
title: "SQLite3Adapter#getDatabaseVersion probes the raw driver, not query_value"
status: blocked
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7546
claim: "2026-09-05T23:56:22Z"
assignee: "converge-pg-native-types-and-instance-type-map-onto-adapter"
blocked-by: "Converging get_database_version onto query_value deadlocks the SQLite lane (base.test.ts 'connection in local time' / 'connection in utc time' hang for 30s; reproduced locally). Routing the probe through queryValue makes it a pooled, logged, lock-taking query issued from INSIDE configureConnection: PoolConfig.serverVersion (pool-config.ts:81-89) takes its monitor, calls getDatabaseVersion, and the resulting queryValue never resolves for a connection established mid-test via establishConnection — while checkVersion (sqlite3-adapter.ts:765, from abstract-adapter.ts:1973 configureConnection) and supportsVirtualColumns (:662, via tableInfo :1288) both re-enter databaseVersion behind that held monitor. Rails has no such cycle: get_database_version's query_value runs on the already-connected raw handle and Ruby's Monitor is thread-reentrant. Verified NOT caused by the async-connect flag (better-sqlite3 is the sync driver here) and NOT fixable inside this story's diff: it needs trails' connect/configure ordering to be able to service a query before configureConnection returns, which is its own story. Story 4's other half (dropping the sqlite-driver-await disable, the dual Promise arms and the 0.0.0 fallback) rides on the same change and is blocked with it. PR #7546 shipped the other three bundled stories; the @missingRailsCall query_value tag is left in place."
closed-reason: null
---

## Context

`SQLite3Adapter#getDatabaseVersion`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1541-1556`)
issues its probe straight on the driver instead of through `queryValue`:

```ruby
# activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:476-478
def get_database_version # :nodoc:
  SQLite3Adapter::Version.new(query_value("SELECT sqlite_version(*)", "SCHEMA"))
end
```

trails does `driver.prepare("SELECT sqlite_version(*) AS v")` and then hand-rolls
both arms (`stmt instanceof Promise`, `row instanceof Promise`), plus a
`new Version("0.0.0")` fallback for the no-driver case that Rails has no
counterpart for. The JSDoc justifies this on the grounds that `queryValue` is
`async` while "the version-gated `supports*()` readers are sync" — **that premise
is now stale**: as of the #6226/#6237 line of work those readers are async
(`sqlite3-adapter.ts:1261, 1285, 1289, 1325, 1345` all `await this.databaseVersion`)
and `checkVersion` (`:1498`) is `async` too. Nothing in the version chain is sync
any more.

Recorded as a call-mismatch baseline row
(`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/sqlite3-adapter.json`,
`get_database_version` / `query_value`) — debt, not permission.

## Converged shape

```ts
override async getDatabaseVersion(): Promise<Version> {
  return new Version(await this.queryValue("SELECT sqlite_version(*)", "SCHEMA"));
}
```

The eslint-disabled `blazetrails/sqlite-driver-await` escape, the dual
Promise-arm branching, and the `"0.0.0"` no-driver fallback all go away with it.
Check whether the deferred async-checkout path (no driver open yet) still needs
an answer, and if so whether the pool memo's own laziness already covers it —
Rails has no connection to ask at that point either.

## Acceptance criteria

- [ ] `SQLite3Adapter#getDatabaseVersion` is `Version.new(query_value(...,
"SCHEMA"))`, matching `sqlite3_adapter.rb:476-478`.
- [ ] The `blazetrails/sqlite-driver-await` disable and the manual Promise-arm
      branching are gone from that method.
- [ ] The `get_database_version` / `query_value` baseline row is deleted, not
      reseeded.
- [ ] SQLite lane green.
