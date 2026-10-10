---
title: "activerecord: adapterClass is typed as the adapter class, so quote_table_name needs no cast"
status: done
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8763
claim: "2026-10-10T18:39:36Z"
assignee: "sqlite3-pg-and-load-schema-driver-shaped-arms-left-after-the-top-level-pass"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of trails PR 8392 (`orderColumn`'s `(this.model as any).adapterClass()`).

`ConnectionHandling#adapter_class`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:338-340`) answers the
adapter CLASS, and Rails calls the quoting class methods on it:
`model.adapter_class.quote_table_name(attr_name)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:2158`), defined in
`Quoting::ClassMethods`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:12,61-68`).

`packages/activerecord/src/connection-handling.ts` `adapterClass` is typed
`new (...args: any[]) => DatabaseAdapter`: a bare constructor with no static side. So every Rails
`adapter_class.quote_table_name` / `quote_column_name` / `column_name_matcher` site in
`packages/activerecord/src/relation/query-methods.ts` reaches the method through `any` or an
`as unknown as {…}` cast: `isTableNameMatches`, `arelColumnWithTable`, `arelColumnAliasesFromHash`,
`orderColumn`, `sanitizeOrderArguments` and the two `columnNameMatcher` / `columnNameWithOrderMatcher`
readers (eight casts in that file).

## Acceptance criteria

- [ ] `adapterClass` (and `DatabaseConfig#adapterClass`, which it returns) is typed as the adapter class with its `Quoting` class methods, e.g. `typeof AbstractAdapter`.
- [ ] The `any` / `as unknown as` casts on `adapterClass()` in `relation/query-methods.ts` are deleted and `pnpm typecheck` is clean.
- [ ] No runtime change: `pnpm parity:api:calls` and `pnpm parity:api:pins` green with no row added.

## Verification

```bash
pnpm typecheck && pnpm vitest run packages/activerecord/src/relation/quoting-via-adapter-class.trails.test.ts packages/activerecord/src/relation/order.test.ts
```
