---
title: "SchemaReflection#cached? flattens Rails' nil predicate return to false"
status: done
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 50
pr: trails#7653
claim: "2026-09-09T19:56:14Z"
assignee: "savepoint-sql-builders-are-three-methods-rails-does-not-have"
blocked-by: null
closed-reason: null
---

## Context

`SchemaReflection#cached?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb:79-88`)
ends with

```ruby
@cache&.cached?(table_name)
```

which answers **nil** when no cache could be loaded, and whatever
`SchemaCache#cached?` (`schema_cache.rb:263`) returns otherwise. trails
(`packages/activerecord/src/connection-adapters/schema-cache.ts`, `isCached`)
flattens that to a boolean:

```ts
return this._cache?.isCached(tableName) ?? false;
```

The `?? false` is a Ruby-predicate-ported-as-boolean deviation — RFC 0082's
convergence class — and it erases the distinction Rails keeps between "no cache
is loaded, so I cannot answer" (nil) and "a cache is loaded and this table is
not in it" (false). #7639 converged the body's load sequence to
`schema_cache.rb:79-88` but left the return coercion in place, since the
`Promise<boolean>` signature predates it.

`BoundSchemaReflection#isCached` (`schema-cache.ts`) forwards the same value and
would widen with it.

## Converged shape

Return `Promise<boolean | null>` (or `undefined`, whichever the repo's settled
spelling for a Ruby `nil` return is here) so the nil arm survives, and check the
call sites — anything doing `if (await reflection.isCached(t))` keeps working,
since `null` is falsy, but a caller distinguishing the two arms becomes
possible.

## Acceptance criteria

- [ ] `isCached` returns Rails' three-valued answer rather than coercing with
      `?? false`, matching `schema_cache.rb:88`.
- [ ] `BoundSchemaReflection#isCached` forwards it unchanged.
- [ ] `schema-cache.test.ts` and `connection-pool.trails.test.ts` keep their
      names and pass; any expectation that asserted `false` for the no-cache arm
      is corrected against Rails' behaviour, not around it.
