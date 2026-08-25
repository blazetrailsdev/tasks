---
title: "SQLite3Adapter builds its statement pool in a field initializer, before the config is read"
status: draft
updated: 2026-08-04
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter` builds its statement pool in a **field initializer** —
`private _statementPool = this.buildStatementPool()`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:325`) — which
runs before the constructor reads `statement_limit` off the config hash. The
constructor therefore has to re-apply the value to an already-built pool:

```ts
if (options.statementLimit !== undefined) {
  this._statementLimit = options.statementLimit;
  this._statementPool.setMaxSize(
    SQLite3Adapter.typeCastConfigToInteger(this._statementLimit) as number,
  );
}
```

Rails has no such second step. `AbstractAdapter#initialize` assigns the pool
once, after the config is in hand — `@statements = build_statement_pool`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:156`)
— and `SQLite3Adapter#build_statement_pool` reads
`@config[:statement_limit]` at that moment
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:803`).
The `setMaxSize` re-entry, and the ordering comment on the `_statementLimit`
declaration that exists only to protect the field-initializer order, are both
artifacts of the TS field-initializer placement, not of Rails.

PostgreSQLAdapter and Mysql2Adapter do not have this problem: they build their
pools lazily on connect, after the constructor has run.

Surfaced while retiring the public `statementLimit` accessor in PR #6098.

## Converged shape

- Assign `_statementPool` in the constructor, after the adapter-level config
  keys are read, mirroring `abstract_adapter.rb:156`.
- Drop the `setMaxSize` re-entry and the declaration-order comment on
  `_statementLimit`.
- `buildStatementPool` keeps reading the limit at construction time, as
  `sqlite3_adapter.rb:803` does.

## Acceptance criteria

- `sqlite3-adapter.ts` has no `setMaxSize` call in its constructor.
- `_statementPool` is assigned once, in the constructor.
- `statement-pool.trails.test.ts` and `sqlite3-adapter.hash-constructor.test.ts`
  pass unchanged.
