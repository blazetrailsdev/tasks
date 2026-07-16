---
title: "TypeCaster::Connection drops the data_source_exists? gate and the with_connection lease (sync/async)"
status: draft
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TypeCaster::Connection#type_for_attribute` (`type_caster/connection.rb:16-26`)
does two things trails cannot do from a synchronous method:

```ruby
schema_cache = @klass.schema_cache
if schema_cache.data_source_exists?(table_name)          # (1)
  column = schema_cache.columns_hash(table_name)[attr_name.to_s]
  if column
    type = @klass.with_connection { |c|                  # (2)
      c.lookup_cast_type_from_column(column) }
  end
end
type || Type.default_value
```

1. **The `data_source_exists?` gate is unported.** trails' `dataSourceExists` is
   `async` (`connection-adapters/schema-cache.ts:211`), and
   `typeForAttribute` is sync. trails substitutes the cached columns hash as the
   gate (`getCachedColumnsHash`, a plain map read — a warmed entry implies the data
   source exists).
2. **The `with_connection` lease is dropped.** trails' `withConnection` returns a
   `Promise` (`connection-handling.ts:366`), so
   `type-caster/connection.ts` reads `_klass.connection` directly — a permanent
   checkout where Rails scopes a lease.

Both are documented in place (`packages/activerecord/src/type-caster/connection.ts`)
rather than silent. Surfaced and left by PR #4889, which converged the rest of the
method (single `lookup_cast_type_from_column`, AR's `defaultValue()` as the miss,
invented `sqlType -> lookupCastType` fallback removed, `klass.columnsHash()`
cross-table fallback removed).

Blocked on the pool async/sync surface convergence: both deviations dissolve only
once a sync caller can reach the pool's async APIs (or those APIs gain sync
equivalents). File the prerequisite before starting.

## Acceptance criteria

- [ ] `typeForAttribute` gates on `data_source_exists?(tableName)` before reading
      `columns_hash`, matching `connection.rb:17-18`.
- [ ] The `lookup_cast_type_from_column` call is scoped to a leased connection,
      matching `connection.rb:21`.
- [ ] The two in-place deviation comments are removed.
- [ ] No test name changes. api:compare / test:compare delta non-negative.
