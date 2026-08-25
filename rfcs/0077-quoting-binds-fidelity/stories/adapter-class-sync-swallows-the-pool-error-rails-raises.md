---
title: "adapter-class-sync-swallows-the-pool-error-rails-raises"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6297
claim: "2026-08-09T20:59:21Z"
assignee: "adapter-class-sync-swallows-the-pool-error-rails-raises"
blocked-by: null
closed-reason: null
---

## Context

Rails' `adapter_class` RAISES when there is no pool: it is
`connection_pool.db_config.adapter_class`
(`activerecord/lib/active_record/connection_handling.rb:338`) and
`connection_pool` resolves with `strict: true`
(`connection_handling.rb:342`), so a model with no established connection gets
`ActiveRecord::ConnectionNotEstablished`.

trails' `adapterClassSync`
(`packages/activerecord/src/connection-handling.ts:533`) swallows that instead:

```ts
try {
  pool = connectionPool.call(this);
} catch {
  return null;
}
```

Every caller then has to re-raise or degrade on its own. Two do:

- `sanitizeSqlForOrder` (`packages/activerecord/src/sanitization.ts`) has an
  explicit `if (!adapterClass) throw new ConnectionNotDefined()`, which is the
  raise `adapter_class` performs by itself. That guard is the only `new` in a
  body whose sole Rails `new` is the `String.new(condition.first)` AFTER
  `disallow_raw_sql!`, so it costs a call-ORDER row in
  `scripts/api-compare/call-mismatches-exclude/activerecord/sanitization.json`
  (`sanitize_sql_for_order`, `order:constructor,disallowRawSqlBang`).
- `query-methods.ts:250` degrades to the abstract matcher instead — tracked by
  `adapterless-schema-quoters-force-lookup-cast-type-guards`.

## Converged shape

`adapterClassSync` propagates the pool error the way `adapter_class` does, so
callers stop re-deriving the raise. Then `sanitizeSqlForOrder`'s guard deletes
and its baseline row goes with it.

## Acceptance criteria

- [ ] `adapterClassSync` no longer swallows the `connectionPool` error; a model
      with no pool raises rather than answering `null`.
- [ ] `sanitizeSqlForOrder`'s `if (!adapterClass) throw` guard is deleted, and
      the `sanitize_sql_for_order` `order:constructor,disallowRawSqlBang` row is
      removed from the call-mismatches baseline.
- [ ] Every other `adapterClassSync` caller is audited for the null contract.
- [ ] parity:api / parity:test delta non-negative; all three adapters green.
