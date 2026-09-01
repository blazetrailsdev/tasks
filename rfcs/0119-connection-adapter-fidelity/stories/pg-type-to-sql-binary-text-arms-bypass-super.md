---
title: "PG type_to_sql binary/text arms hardcode literals where Rails calls super(type)"
status: draft
updated: 2026-09-01
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

`PostgreSQL::SchemaStatements#type_to_sql`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`)
hardcodes its `binary` and `text` arms to the literals `"bytea"` and
`"text"` after the limit check.

Rails calls `super(type)` in both arms —
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:832-847`:

```ruby
when "binary"
  case limit
  when nil, 0..0x3fffffff; super(type)
  else raise ArgumentError, "No binary type has byte size #{limit}. ..."
  end
when "text"
  case limit
  when nil, 0..0x3fffffff; super(type)
  else raise ArgumentError, "No text type has byte size #{limit}. ..."
  end
```

`super(type)` passes the type alone, deliberately dropping `limit` so the
base renders the bare `native_database_types[:binary]` / `[:text]` name with
no `(N)` suffix. The port produces the same string today only because those
two entries happen to be `"bytea"` and `"text"`; the lookup is bypassed, so
a `native_database_types` override never reaches them.

The `integer` arm is a genuine Rails special case (`:848-854`) and stays
inline. Surfaced in PR #7327, which converged the `else` arm to `super` but
left these two.

## Converged shape

Replace the two literals with `super.typeToSql(type as ColumnType, {})` —
the TS spelling of `super(type)`, no kwargs forwarded — keeping the
surrounding `limit` range checks and their `ArgumentError` messages verbatim.

## Acceptance criteria

- [ ] Both arms render through the base body rather than a literal.
- [ ] The byte-size `ArgumentError` messages and their bounds are unchanged.
- [ ] The PostgreSQL AR lanes stay green, including `schema-dumper.test.ts`.
