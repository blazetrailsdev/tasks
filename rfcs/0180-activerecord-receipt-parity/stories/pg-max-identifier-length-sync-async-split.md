---
title: "PG max_identifier_length is split across a sync reader and an async warmer"
status: blocked
updated: 2026-09-30
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: "2026-09-30T22:50:28Z"
assignee: "relation-count-type-is-a-union-even-when-ungrouped"
blocked-by: "Sync caller cannot be made async: PG table_alias_length IS max_identifier_length (abstract/database_limits.rb:16-18), and JoinDependency#initialize reads it synchronously via AliasTracker.create (join_dependency.ts _baseTableAliasLength -> connection.tableAliasLength()) inside the sync toSql/_applyEagerJoinDependency builders that CLAUDE.md § 'Relation is evaluated by an async query' ratifies as sync; Calculations#column_alias_for's truncate (relation/calculations.ts:52) is a second sync reader. An async max_identifier_length therefore needs an async table_alias_length, which the ratified sync JoinDependency build cannot await."
closed-reason: null
---

# PG max_identifier_length is split across a sync reader and an async warmer

## Context

Rails (`connection_adapters/postgresql_adapter.rb:620-622`):

```ruby
def max_identifier_length
  @max_identifier_length ||= query_value("SHOW max_identifier_length", "SCHEMA").to_i
end
```

One method: lazy `||=` around a query, read synchronously by
`DatabaseLimits`' identifier-length callers.

trails splits it in two (`postgresql-adapter.ts:2452+`): a synchronous
`maxIdentifierLength()` returning `this._maxIdentifierLength ?? 63`, and an
async `warmMaxIdentifierLength()` (tagged `@noRailsEquivalent PERMANENT`) that
does the `queryValue`. One `kind: "set"` row (`query_value`) in the exclude
shard after PR #6581.

The 63 fallback is PostgreSQL's compile-time `NAMEDATALEN-1`, so it matches the
server on a stock build — but a server built with a larger `NAMEDATALEN`, or any
caller reached before the warmer has run, silently gets the wrong limit where
Rails would have queried. The warmer is also invented public surface that has to
be called from the right places by hand.

## Converged shape

- One `maxIdentifierLength()` at the Rails name doing the lazy query, which
  means it returns `Promise<number>` and its callers (`renameTable`, index and
  alias name-length checks, `DatabaseLimits`) await it.
- `warmMaxIdentifierLength` and its `@noRailsEquivalent` tag are deleted, and
  `parity:api:extra --package activerecord` falls by one.
- If a synchronous caller genuinely cannot be made async, that caller is the
  story's real subject — record which one and why, rather than keeping the
  split.
- Delete the row from the exclude shard and tighten the mark.

## Acceptance criteria

- [ ] `max_identifier_length` row count for `postgresql-adapter.ts` is 0.
- [ ] `warmMaxIdentifierLength` no longer exists; `parity:api:extra` falls.
- [ ] A test with a stubbed non-63 `SHOW max_identifier_length` proves the
      queried value is used (fails on today's fallback).
- [ ] `pnpm parity:api:calls` green; no baseline widened.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
