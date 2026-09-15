---
title: "Relation#_conn residual callers (pluck, calculations helpers, arel) borrow via with_connection"
status: in-progress
updated: 2026-09-15
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#7792
claim: "2026-09-15T14:28:52Z"
assignee: "relation-conn-residual-callers-borrow-via-with-connection"
blocked-by: null
closed-reason: null
---

## Context

After trails#7781, `Relation#_conn()` (`packages/activerecord/src/relation.ts`) no longer
falls back to the deprecated `model.connection`. It resolves through
`connectionPool().withConnectionSync((c) => c)`, which hands a connection out of its
lease. Its remaining callers are not Rails' shape:

- `relation/calculations.ts` `pluck`: `this._conn().selectAll(manager, "... Pluck")`.
  Rails `calculations.rb:321-322` is `model.with_connection do |c| c.select_all(relation.arel, "#{model.name} Pluck", async: @async)`.
- `relation/calculations.ts` `needsBigintCast` / `compileManagerWithBinds`, which are
  trails-only helpers. They should take `c` from the caller's `with_connection` block.
- `relation/query-methods.ts` `arel`: `buildArel(this._conn(), aliases)`, tagged
  `@missingRailsCall with_connection — PERMANENT`. Rails `query_methods.rb:1594-1596` is
  `@arel ||= with_connection { |c| build_arel(c, aliases) }`, so use the pool's
  sync lease inline and drop the PERMANENT tag.
- `toSql` is already covered by `converge-sync-eager-builders-async-to-sql`.

## Acceptance criteria

- `pluck` borrows via `withConnection` and threads `c` into `select_all`, mirroring `calculations.rb:321-322`.
- The calculations helpers receive the connection as a parameter.
- `arel` resolves its connection inside a lease block; the PERMANENT `@missingRailsCall` tag is removed.
- `_conn()` is deleted once it has no callers besides `toSql`, or it is left only for `toSql`.
- `pnpm parity:api:calls` is green.
