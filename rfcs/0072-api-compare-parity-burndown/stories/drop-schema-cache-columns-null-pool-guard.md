---
title: "Drop SchemaCache#columns' null-pool guard once binding is centralized"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 5917
claim: "2026-08-02T19:55:26Z"
assignee: "drop-schema-cache-columns-null-pool-guard"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while retiring `poolAbsent` / `realPool` in #5885.

`SchemaCache#columns` in
`packages/activerecord/src/connection-adapters/schema-cache.ts` carries a guard
Rails' `SchemaCache#columns` (`schema_cache.rb:350-360`) does not have:

```ts
if (pool == null || pool instanceof NullPool) return undefined;
```

Rails needs no such guard because the pool handle a `SchemaCache` method
receives is never a bare/null pool: `AbstractAdapter#schema_cache`
(`abstract_adapter.rb:298-300`) resolves
`@pool.schema_cache || BoundSchemaReflection.for_lone_connection(@pool.schema_reflection, self)`,
so a standalone adapter's NullPool (whose `schema_cache` is nil) is swapped for
a `FakePool` wrapping the connection itself (`schema_cache.rb:143-157`). By
construction every pool reaching `columns` can yield a connection.

PR #5885 moved the production call sites onto that FakePool shape and inlined the
guard (it had been the exported `poolAbsent`), but left the guard standing,
because trails' `SchemaCache` methods still take an explicit pool argument that
any caller can populate with anything. Removing the guard is only safe once the
binding is centralized.

Sibling story: `converge-schema-cache-getter-onto-bound-reflection` converges
the `schemaCache` getter's return type. This story is the downstream cleanup —
they may be worth bundling.

## Acceptance criteria

- Confirm no caller can reach `SchemaCache#columns` with a null/NullPool pool
  once the bound-reflection binding is centralized.
- Remove the guard, and the now-unneeded `NullPool` import in `schema-cache.ts`.
- Verify a standalone adapter still reflects columns (the
  `columnForAttribute` bare-adapter path from #5885 must keep working).
- Existing tests pass; no test renames.
