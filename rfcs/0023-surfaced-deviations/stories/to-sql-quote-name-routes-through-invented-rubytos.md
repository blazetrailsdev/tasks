---
title: "ToSql#quoteTableName/quoteColumnName route the name through an invented rubyToS helper"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::ToSql#quote_table_name` and `#quote_column_name` pass `name`
straight to the connection after a SqlLiteral pass-through guard. trails routes
it through a local `rubyToS()` helper first.

Rails (`activerecord/lib/arel/visitors/to_sql.rb`):

```ruby
def quote_table_name(name)
  return name if Arel::Nodes::SqlLiteral === name
  @connection.quote_table_name(name)
end
```

trails today (`packages/arel/src/visitors/to-sql.ts:1673,1679`):

```ts
return this.connection.quoteTableName(rubyToS(name));
...
return this.connection.quoteColumnName(rubyToS(name));
```

`rubyToS` is a module-local function at `to-sql.ts:116` with no Rails
counterpart. Surfaced by the RFC 0096 arel naming burndown (PR #6350) as two
`naming` rows where Rails passes `name` and trails passes `rubyToS`; deliberately
NOT renamed there, because the local is an invented conversion and renaming it
would have papered over an extra call.

Establish what `rubyToS` is actually absorbing before deleting it — the callers
may be handing in a non-string that Ruby would have stringified implicitly at a
DIFFERENT point (Ruby's `quote_table_name` implementations call `to_s`
themselves in some adapters). If the conversion is load-bearing, it belongs
inside the adapter's `quoteTableName` where Ruby does it, not at the Arel call
site.

## Converged shape

Delete the `rubyToS` wrapper from both call sites and pass `name`, relocating any
genuinely required stringification into whichever adapter method Ruby performs it
in. If `rubyToS` turns out to have no remaining callers, remove it — it is
unreferenced invented surface.

## Acceptance criteria

1. `quoteTableName` / `quoteColumnName` in `visitors/to-sql.ts` pass `name` as
   Rails does.
2. `rubyToS` is deleted, or its remaining callers and their Rails justification
   are documented at the call site.
3. The two `naming` rows for `visitors/to-sql.ts` `quote_table_name` /
   `quote_column_name` in `pnpm parity:api:calls:args:report` are gone; report
   before/after.
4. `pnpm vitest run packages/arel` green, and the activerecord adapter suites
   that render table/column names stay green on all three lanes.
