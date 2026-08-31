---
title: "SQLite3Adapter#getDatabaseVersion probes the raw driver, not query_value"
status: blocked
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7280
claim: "2026-08-31T00:34:21Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: "The converged Version.new(query_value(...)) body makes the version probe a real query, but SQLite3Adapter's constructor fires configure_connection (-> check_version -> databaseVersion) without an await (sqlite3-adapter.ts:297). The in-flight probe then outlives its caller and reconnects an adapter disconnected meanwhile, via rawExecute -> ensureConnected -> verifyBang. Measured on PR #7280: reds all 5 AR lanes on connection-pool.test.ts:452 (isConnected after disconnectBang), with-transactional-fixtures.trails.test.ts:77/120 (fixture rollback + 'database is locked'), transactions.trails.test.ts:173/184 (savepoint dirtying), and sqlite3-adapter-perform-query.trails.test.ts (statement-lock reordering). Unblocking needs the constructor's deferred configure_connection to stop resurrecting a closed connection - a redesign of that deferral, not of get_database_version, whose Rails shape is otherwise correct and was verified working in isolation."
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
