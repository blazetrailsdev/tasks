---
title: "Converge build_statement_pool to inline type_cast_config_to_integer (PG/MySQL/SQLite adapters)"
status: claimed
updated: 2026-06-30
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-06-30T14:53:29Z"
assignee: "build-statement-pool-inline-type-cast-config-to-integer"
blocked-by: null
---

## Context

Surfaced by PR #4302 (wide-call-analyzer-resolve-calls-through-locals). Once the
wide call analyzer captured `new Foo(...)` as a `constructor` call, the
`build_statement_pool` pairs began being compared and now flag a genuine
omission of `type_cast_config_to_integer`, baselined in
`scripts/api-compare/call-mismatches-wide-exclude.json`.

Rails (`activerecord/.../postgresql_adapter.rb:1055`):

```ruby
StatementPool.new(self, type_cast_config_to_integer(@config[:statement_limit]))
```

trails (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:4657`,
mirrored in `abstract-mysql-adapter.ts` and `sqlite3-adapter.ts`):

```ts
buildStatementPool(client) { return new StatementPool(client, this._statementLimit); }
```

The `type_cast_config_to_integer` call is HOISTED — `this._statementLimit` is
precomputed earlier (constructor) rather than called inline in the ctor arg, so
`buildStatementPool` itself no longer names the call. Functionally equivalent but
a structural deviation from Rails' inline shape.

## Acceptance criteria

- [ ] Decide converge vs. ratify per the deviation-stories convention (default:
      converge to Rails). If converging, inline `typeCastConfigToInteger(...)`
      into the `buildStatementPool` ctor arg (or otherwise make the call appear
      in the method body) across the PG / abstract-mysql / sqlite3 adapters.
- [ ] Drop the three `build_statement_pool → type_cast_config_to_integer`
      entries from `call-mismatches-wide-exclude.json` once they no longer flag.
- [ ] No behavior change to the computed statement limit.
