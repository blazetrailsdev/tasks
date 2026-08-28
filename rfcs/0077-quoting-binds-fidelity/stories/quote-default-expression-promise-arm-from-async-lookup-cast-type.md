---
title: "quote_default_expression carries a Promise arm because PG's lookup_cast_type is async"
status: draft
updated: 2026-08-28
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `quote_default_expression` carries a Promise arm because PG's `lookup_cast_type` is async

## Context

Surfaced while landing #7185 (`pg-quote-default-expression-lacks-super-arm`), which
gave the PG body its missing `else super` arm.

Rails, `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:156-162`:

```ruby
def quote_default_expression(value, column) # :nodoc:
  if value.is_a?(Proc)
    value.call
  else
    value = lookup_cast_type(column.sql_type).serialize(value)
    quote(value)
  end
end
```

That body returns a String. PG's private `lookup_cast_type`
(`postgresql/quoting.rb:195-197`) is
`super(query_value("SELECT #{quote(sql_type)}::regtype::oid", "SCHEMA").to_i)` —
a blocking query in Ruby, so the caller never sees a future.

In trails, `PostgreSQLAdapter#lookupCastType`
(`connection-adapters/postgresql-adapter.ts:1846`) is `async` (it awaits
`queryValue`), so the abstract body at
`connection-adapters/abstract/quoting.ts:160` carries a branch Rails does not
have:

```ts
const castType = this.lookupCastType(column.sqlType ?? null) as Type | Promise<Type>;
if (castType instanceof Promise) {
  return castType.then((type) => this.quote(type.serialize(value)));
}
return this.quote(castType.serialize(value));
```

and three `quoteDefaultExpression` signatures (abstract, postgresql, sqlite3)
are widened from Rails' `String` to `string | Promise<string>` to carry it —
`sqlite3/quoting.ts:115` is widened purely because it delegates to the abstract
body, not because anything in it is async.

## Converged shape

One body matching rb:156-162: `lookup_cast_type(column.sql_type)` then
`quote(type.serialize(value))`, returning a `string`. That needs PG's oid
round-trip served without a query at call time — the type map is already warmed
per connection (`reloadTypeMap`), so the remaining work is to resolve
`sql_type -> oid` off warmed state instead of issuing
`SELECT ...::regtype::oid` inline. Then the `instanceof Promise` arm and all
three widened return types go.

## Acceptance criteria

- [ ] `abstract/quoting.ts#quoteDefaultExpression` has no `Promise` branch and
      returns `string`, matching rb:156-162.
- [ ] The `quoteDefaultExpression` return type is `string` in abstract,
      postgresql and sqlite3.
- [ ] PG's `lookupCastType` no longer issues a query per call, or its callers
      no longer need one.
- [ ] parity:api / parity:test delta non-negative; all three lanes green.
