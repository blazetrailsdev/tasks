---
title: "api-compare: resolve partially-qualified include/extend names via namespace prefix walk"
status: claimed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 80
priority: 10
pr: null
claim: "2026-07-26T02:06:54Z"
assignee: "api-compare-resolve-relative-qualified-includes"
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). `resolveModuleName` bails out on any partially-qualified
`include`/`extend` name, returning the _relative_ string verbatim as if it
were a fully-qualified module name:

```ts
// scripts/api-compare/compare.ts:683
if (incName.includes("::")) return [incName];
```

Rails' `postgresql_adapter.rb:183` says `include PostgreSQL::Quoting` inside
`module ActiveRecord::ConnectionAdapters`. The real FQN is
`ActiveRecord::ConnectionAdapters::PostgreSQL::Quoting`, but
`resolveModuleName` returns `"PostgreSQL::Quoting"`, which matches no key in
`rubyPkg.modules`, so `collectAllowedNames`
(`scripts/api-compare/extra-surface.ts:530` — `if (!mod) continue;`) silently
drops the entire mixin. Every method the mixin contributes then scores as
extra surface on the host file.

Scale: **54 relative-qualified includes across the vendored Rails manifest
resolve cleanly under a namespace-prefix walk** but currently resolve to
nothing. In activerecord alone that includes `ActiveRecord::Base` ←
`Locking::Optimistic`, `Locking::Pessimistic`,
`Encryption::EncryptableRecord`, `Marshalling::Methods`,
`QueryCache::ClassMethods`, `Delegation::DelegateCache`,
`Aggregations::ClassMethods`; `PostgreSQLAdapter` ← `PostgreSQL::Quoting`,
`PostgreSQL::ReferentialIntegrity`, `PostgreSQL::SchemaStatements`,
`PostgreSQL::DatabaseStatements`; `SQLite3Adapter` ← the three `SQLite3::*`
siblings; `AbstractMysqlAdapter` ← the three `MySQL::*` siblings;
`Mysql2Adapter` ← `Mysql2::DatabaseStatements`; `ConnectionPool`/`NullPool` ←
`ConnectionAdapters::AbstractPool`; `Relation` ← `SignedId::RelationMethods`,
`TokenFor::RelationMethods`; `Type::{Date,DateTime,Time}` ←
`Internal::Timezone`.

Measured impact (patched `compare.ts` locally with a prefix walk, re-ran
`pnpm api:extra --package activerecord`, then reverted): activerecord moved
extras **2084 → 1901 (−183)**. Per file:
`connection-adapters/postgresql-adapter.ts` 149 → 36,
`connection-adapters/sqlite3-adapter.ts` 71 → 38,
`connection-adapters/abstract-mysql-adapter.ts` 37 → 22, `base.ts` 155 → 144,
`relation.ts` 11 → 7. Novel count is unchanged at 776 (these names all exist
somewhere in Rails, so they were classified `moved`).

The fix is the same prefix walk the unqualified branch already does
(`compare.ts:688-693`), applied to the qualified branch by keying
`moduleFqnByShort` on the include's last segment:

```ts
if (incName.includes("::")) {
  const parts = contextFqn.split("::");
  for (let i = parts.length; i > 0; i--) {
    const cand = `${parts.slice(0, i).join("::")}::${incName}`;
    if (moduleFqnByShort.get(incName.split("::").pop()!)?.includes(cand)) return [cand];
  }
  return [incName];
}
```

`resolveModuleName` is shared with `compare.ts`'s own
`flattenIncludedMethodInfos`, so fixing it will also expand the Rails-side
expected surface for those hosts — `api:compare` totals may move. That is the
correct direction (previously-invisible Rails methods becoming visible), but
verify and report the delta rather than papering over it.

## Acceptance criteria

- `resolveModuleName` resolves partially-qualified include/extend names by
  walking namespace prefixes of `contextFqn`, falling back to the verbatim
  name only when no prefix match exists. A leading `::` still short-circuits
  to the absolute name (`compare.ts:682`) — do not regress that.
- Unit coverage in `scripts/api-compare/compare.test.ts` for: relative
  qualified name resolving via prefix walk; fully-qualified name that already
  matches; `::`-absolute name; and a qualified name with no match anywhere
  (verbatim fallback).
- `pnpm api:compare` re-run: report the overall methods/files/arity delta in
  the PR body. If ported-method counts move, explain each direction.
- `pnpm api:extra --package activerecord` moved count drops to ~1901; record
  the exact number.
