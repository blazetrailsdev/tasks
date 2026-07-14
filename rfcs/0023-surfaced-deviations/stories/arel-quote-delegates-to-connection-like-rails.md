---
title: "arel-quote-delegates-to-connection-like-rails"
status: done
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4868
claim: "2026-07-14T18:31:12Z"
assignee: "arel-quote-delegates-to-connection-like-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails' Arel does **no** value formatting of its own. `Arel::Visitors::ToSql#quote`
is a two-line delegation (`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:867-870`):

```ruby
def quote(value)
  return value if Arel::Nodes::SqlLiteral === value
  @connection.quote value
end
```

`Arel::Visitors::PostgreSQL` has **no** `quote` override at all, and
`grep -rn "quoted_date|encode_array|quote_array" vendor/rails/activerecord/lib/arel/`
returns nothing. All date/array literal formatting lives in the adapter:
`quote(OID::Array::Data)` → `encode_array` → `type_cast_array` → `type_cast` →
`when Date, Time then quoted_date` (`abstract/quoting.rb:94-107`, `184-196`;
`postgresql/quoting.rb:221-226`).

Trails diverges structurally: `packages/arel/src/visitors/to-sql.ts` owns a
`quotedDate` / `formatDate` pair, `packages/arel/src/quote-array.ts` owns a
`quoteArrayLiteral`, and `visitors/postgresql.ts` overrides `quote` to use them
— none of which exist in Rails' Arel. PR #4867 made the array path
self-consistent with the scalar path within this invented surface (a behavior
fix), but did not remove the surface; it added `formatDate` + `formatArrayDate`
to it.

The structural reason the surface exists: trails constructs Arel visitors with
**no connection** in many call sites (e.g. `new Visitors.PostgreSQL()` throughout
`packages/arel/src/visitors/postgres.test.ts`), so there is no `@connection` to
delegate to. Rails always has one. That is why this could not be folded into PR #4867 — it is a
structural refactor, not a formatting fix.

Note the parallel: PR #4851 moved ActiveRecord's `base.ts` array-literal sites
off `quoteSqlValue`/`quoteArrayLiteral` and onto `adapter.quote(raw)` — the same
delegate-to-the-adapter direction this story applies to the Arel layer.

## Acceptance criteria

- [ ] `Arel::Visitors::ToSql#quote` delegates to the connection's `quote`
      (matching `to_sql.rb:867-870`), rather than formatting values itself.
- [ ] The `PostgreSQL` visitor's `quote` override is removed; PG array literals
      route through the adapter's `quote` → `encode_array` → `type_cast_array`.
- [ ] `quotedDate` / `formatDate` / `quoteArrayLiteral` are removed from
      `packages/arel` once no caller remains, or the residue is documented with
      the Rails anchor for why it must stay.
- [ ] Arel visitor call sites that construct a visitor without a connection are
      converged to supply one (or a documented minimal quoting host).
- [ ] api:compare / test:compare delta non-negative.
