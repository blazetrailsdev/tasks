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

This is NOT a two-producer fix. A full audit
(`git grep -n "type_casted_binds:" -- packages/activerecord/src --include=*.ts | grep -v '\.test\.ts'`)
finds **16 producers across 6 files** using FOUR different strategies. This list
is the sweep checklist — it is exact, verified 2026-07-14:

**Strategy A — standalone free function (9 sites)**, `temporalToBindString`, no
adapter `type_cast`:

- `abstract/database-statements.ts:1371`
- `abstract/query-cache.ts:598` (the cached payload; the one this story is about)
- `mysql2-adapter.ts:630,914,979,1165`
- `sqlite3-adapter.ts:462,575,779`

**Strategy B — raw uncast binds (5 sites)**, passed straight through:

- `postgresql-adapter.ts:977,1612,1703,1767,2155`

**Strategy C — hardcoded `[]` (1 site)**:

- `sqlite3-adapter.ts:714`

**Strategy D — forwarded caller-supplied param (1 site)**:

- `abstract-adapter.ts:2350` — `log(sql, name, binds, typeCastedBinds = [], ...)`.
  NOTE: this one is Rails-SHAPED, not a divergence in itself. Rails' `log`
  (`abstract_adapter.rb:1134`) also takes `type_casted_binds = []` as a
  parameter, and its callers pass the value (sometimes a lambda) in. So the fix
  for D is at its callers, not the signature. Do not "converge" D by making it
  self-dispatch.

Counting note: an earlier draft said 17 — that included `bind-parameter.test.ts:63`,
which is a consumer-side test (and is already correct: it uses
`conn.typeCastedBinds`), not a producer.

So the cached-vs-uncached payloads ALREADY disagree today on PG (uncached raw,
cached free-function). Converging query-cache.ts alone would make the cached
payload individually Rails-faithful while introducing a NEW cached-vs-uncached
disagreement on SQLite, where the two currently agree (`[1]` vs `[1n]`), and
would leave the other 15 producers unconverged.

The work is a systemic sweep of the 15 A/B/C sites onto `this.typeCastedBinds`
(D is Rails-shaped — fix its callers instead), with the Number→BigInt fallout
checked per adapter — not a one-line change. PR #4866 left it alone for that
reason.

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
