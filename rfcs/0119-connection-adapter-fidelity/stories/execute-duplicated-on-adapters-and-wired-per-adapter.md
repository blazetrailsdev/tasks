---
title: "execute is shadowed on all three adapters, forcing three per-adapter dirties_query_cache calls where Rails wires it once on the base class"
status: draft
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

Surfaced by review of PR #7540, which converged `rollback_db_transaction` and
the `dirties_query_cache` list onto the abstract class. `execute` is the one
remaining name in Rails' list that trails still wires per-adapter.

Rails defines `execute` once, on the abstract class
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:136-138`):

```ruby
def execute(sql, name = nil, allow_retry: false)
  internal_execute(sql, name, allow_retry: allow_retry)
end
```

**No adapter overrides it.** Adapters specialise the layer underneath —
`raw_execute` (`abstract/database_statements.rb:552`) — and `execute` reaches
them through `internal_execute`. Because there is exactly one definition,
Rails' `QueryCache.included` wires `:execute` for query-cache dirtying exactly
once, on the base class (`abstract/query_cache.rb:12-13`).

trails has the abstract one too — `abstract/database-statements.ts:326`,
exported in the `DatabaseStatements` mixin (`:1000`) and so present on
`AbstractAdapter.prototype`, and declared on the merged interface
(`abstract-adapter.ts:671`). But three adapters shadow it:

- `sqlite3-adapter.ts:1849` — `SQLite3Adapter.prototype.execute = sqliteExecute`
- `postgresql-adapter.ts:2717` — `(PostgreSQLAdapter.prototype as any).execute = pgExecute`
- `mysql2-adapter.ts:463` — a real `async execute()` class method that inlines
  `preprocessQuery` / `mysqlQuote` / `log` / `withRawConnection` / `performQuery`

and each therefore needs its own `dirtiesQueryCache(<Adapter>, "execute")`
(`sqlite3-adapter.ts:1853`, `postgresql-adapter.ts:2748`,
`mysql2-adapter.ts:1050`) to re-wrap the shadowing copy, because the base-class
wrapper cannot see past an override.

**This is a structural deviation, not a live bug** — measured on
2026-09-06, all three adapters do have an own `execute` at the moment their
module-level `dirtiesQueryCache` call runs, so all three are wrapped and the
dirtying works today. The cost is the duplication itself: three copies of a
one-line Rails delegation, three re-wiring calls Rails does not have, and an
`as any` cast to install one of them.

It is also fragile in a specific way worth writing down. `dirtiesQueryCache`
reads `base.prototype[methodName]` and silently `continue`s when it is not a
function (`abstract/query-cache.ts:405-417`). The abstract members arrive via
`ensureAbstractAdapterMixinsApplied()`, which fires from the `AbstractAdapter`
**constructor** (`abstract-adapter.ts:752`), not at module evaluation. So the
moment any one of these three adapters stops defining its own `execute` —
which is what converging it means — its module-level
`dirtiesQueryCache(<Adapter>, "execute")` call starts finding nothing on the
prototype and skips without error, and the cache silently stops being dirtied.
The per-adapter call must be deleted in the same change that deletes the
override, never before or after.

Sibling stories in the same family, both filed from the same review:
[[savepoint-methods-duplicated-on-adapters]] and
[[mysql2-rollback-db-transaction-duplicated-on-adapter]].

## Acceptance criteria

- [ ] `execute` exists once, as the abstract delegation to `internalExecute`
      that `database_statements.rb:136-138` defines; the SQLite3, PostgreSQL
      and Mysql2 copies are gone, with whatever they specialise pushed down
      into `rawExecute` / `internalExecute` the way Rails layers it.
- [ ] The three `dirtiesQueryCache(<Adapter>, "execute")` calls are gone and
      `"execute"` is in the `dirtiesQueryCache(AbstractAdapter, ...)` list, in
      the position `abstract/query_cache.rb:13` gives it (second, after
      `exec_query`). Verify at runtime that each adapter's `execute` is still
      wrapped — a green suite does not prove this, since a skipped wiring is
      silent.
- [ ] The `(PostgreSQLAdapter.prototype as any).execute = pgExecute` cast site
      is gone with the override.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green, including
      `query-cache.test.ts`'s `execute clear cache`.
