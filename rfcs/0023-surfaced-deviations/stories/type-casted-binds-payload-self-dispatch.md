---
title: "type-casted-binds-payload-self-dispatch"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

Found while making `cacheNotificationInfo`'s `type_casted_binds` lazy (story
`cache-notification-info-lazy-binds-and-name-passthrough`, PR #4866).

Rails has exactly ONE `type_casted_binds`, a private Quoting method at
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:224`:

```ruby
def type_casted_binds(binds)
  binds&.map do |value|
    ActiveModel::Attribute === value ? type_cast(value.value_for_database) : type_cast(value)
  end
end
```

Every producer of the `type_casted_binds` payload slot — `cache_notification_info`
(query_cache.rb:311) and the `log(...)` call sites — reaches it via `self`, so the
ADAPTER's `type_cast` override applies on both the cached and uncached paths.

trails has TWO implementations that do not agree:

1. `connection-adapters/abstract/quoting.ts:451` — the faithful port. Calls
   `this.typeCast(...)`, mixed onto AbstractAdapter via the `Quoting` object,
   reachable as `conn.typeCastedBinds` (used by `bind-parameter.test.ts:63`).
2. `connection-adapters/abstract/database-statements.ts:1336` — an exported free
   function that never reaches adapter `type_cast`; it applies
   `temporalToBindString(v)` instead.

`query-cache.ts` and `logSql` (database-statements.ts:1371) both import #2, so no
payload producer currently honors an adapter's `typeCast`.

The two are observably different. Locally on SQLite, swapping query-cache.ts to
`this.typeCastedBinds(binds)` flipped the cached payload for `Task.find(1)` from
`[1]` to `[1n]` — the adapter `typeCast` yields a BigInt where the free function
yields a Number.

Converging only ONE path is a regression: it makes the cached and uncached
payloads for the same query disagree. This must be done for both producers at
once, which is why PR #4866 deliberately left it alone.

## Acceptance criteria

- [ ] Payload producers (`cacheNotificationInfo` in query-cache.ts, `logSql` in
      database-statements.ts) dispatch `type_casted_binds` through
      `this.typeCastedBinds(binds)` so adapter `type_cast` applies, per
      quoting.rb:224.
- [ ] The `database-statements.ts:1336` free function is removed, or reduced to a
      non-payload helper with a documented reason it cannot use adapter type_cast.
- [ ] `temporalToBindString` behavior that the free function provided is preserved
      where still needed — check whether adapter `typeCast` already covers the
      temporal cases, and port any gap into the adapter's `typeCast`.
- [ ] Cached and uncached `sql.active_record` payloads carry equal
      `type_casted_binds` for the same query. Add a test asserting this.
- [ ] Number-vs-BigInt fallout is checked against LogSubscriber rendering and
      `bind-parameter.test.ts`; verified on SQLite, PG, and MySQL in CI.
