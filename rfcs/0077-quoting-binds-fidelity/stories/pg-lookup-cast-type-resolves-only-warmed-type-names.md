---
title: "PG lookup_cast_type resolves only warmed type names, where Rails queries regtype live"
status: draft
updated: 2026-08-29
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Landed with #7189 (`quote-default-expression-promise-arm-from-async-lookup-cast-type`),
which converged `quote_default_expression` to Rails' String-returning single-branch
body (`activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:156-162`)
by making PostgreSQL's `lookup_cast_type` synchronous.

Rails, `activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:194-197`:

```ruby
def lookup_cast_type(sql_type)
  super(query_value("SELECT #{quote(sql_type)}::regtype::oid", "SCHEMA").to_i)
end
```

That is a live query, so it resolves **any** type name valid at call time.
trails resolves the same mapping off the warmed type map instead
(`connection-adapters/postgresql-adapter.ts` `lookupCastType`, plus
`postgresql/oid/type-map-initializer.ts` `registerSqlTypeName`), because
`quote_default_expression` returns a String and cannot await.

Two residual gaps follow, both degrading silently to `ValueType` (identity
serialize) where Rails resolves the real type:

1. A type created by a raw `execute("CREATE TYPE ...")` that bypasses
   `create_enum` / `create_domain`. Every schema-statements path that mutates a
   type reloads the map in Rails (`postgresql_adapter.rb:478,489,559,575,584,602,615,996`)
   and trails mirrors all of them, so this is narrow — but real.
2. A native type whose OID was never registered by any of the four warm-up
   queries. `registerSqlTypeName` skips a row whose OID is not already a store
   key, so e.g. `point` or `hstore` can be absent when nothing pre-registered it.

Both were reviewed and accepted as the cost of the story on #7189; this story
tracks converging them.

## Converged shape

Rails resolves at call time. The trails equivalent is to resolve on a miss
rather than only at warm time — `lookup_cast_type` returns `ValueType` today
where Rails would have queried. Options to weigh:

- Warm on miss from the async callers (`schema_creation.accept` is already
  async), so the sync body still sees a populated map.
- Widen the warm-up to register every `pg_type` row rather than the four
  filtered queries, removing gap 2 outright.

Gap 1 may be unconvergeable without sync IO; if so, block with that finding
rather than re-justifying it.

## Acceptance criteria

- [ ] A type created by raw `execute("CREATE TYPE ...")` mid-session resolves
      through `quoteDefaultExpression` the way Rails' regtype query resolves it,
      or the story is blocked with the specific blocker.
- [ ] A native type absent from the warm-up queries no longer falls back to
      `ValueType` silently.
- [ ] Regression test fails on baseline.
- [ ] parity:api / parity:test delta non-negative; all three lanes green.
