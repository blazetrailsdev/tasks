---
title: 'columns_hash skips deep_deduplicate on its key and init_with drops coder["columns_hash"]'
status: claimed
updated: 2026-08-29
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: "2026-08-29T11:52:35Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

PR #7098 converged `derive_columns_hash_and_deduplicate_values` and `indexes`
onto `deep_deduplicate` (`schema_cache.rb:440-446`, `:367`). Two smaller
`SchemaCache` sites in the same file were left behind:

1. **`columns_hash` does not intern its key.** Rails
   (`schema_cache.rb:351-356`):

   ```ruby
   def columns_hash(pool, table_name)
     @columns_hash.fetch(table_name) do
       @columns_hash[deep_deduplicate(table_name)] = columns(pool, table_name).index_by(&:name).freeze
     end
   end
   ```

   trails' `columnsHash` (`packages/activerecord/src/connection-adapters/schema-cache.ts`)
   stores under the raw `tableName` and does not freeze the derived hash.

2. **`initWith` drops `coder["columns_hash"]`.** Rails' `init_with`
   (`schema_cache.rb:281-292`) reads all five members, `@columns_hash =
coder["columns_hash"]` among them, before the `unless coder["deduplicated"]`
   guard. trails reads `columns`, `primary_keys`, `data_sources`, `indexes` and
   `version` but never `columns_hash`, so a dump that declares itself
   `deduplicated` loads with an empty `_columnsHash` — the derive step that
   would have rebuilt it is exactly what the guard skips. `encodeWith` doesn't
   emit `columns_hash` either (Rails' `encode_with` at `:271-278` doesn't
   emit it), so this only bites a caller that hands `init_with` a coder it
   built itself — which is what `schema_cache_test.rb:404-424` does.

## Converged shape

- `columnsHash` sets `this._columnsHash.set(deepDeduplicate(tableName), ...)`
  and freezes the derived record, mirroring `schema_cache.rb:353`.
- `initWith` reads `coder["columns_hash"]` into `_columnsHash` alongside the
  other four members, mirroring `schema_cache.rb:283`.

## Acceptance criteria

- Both sites match the cited Rails lines.
- A test loads a coder carrying `columns_hash` plus `deduplicated: true` and
  asserts `_columnsHash` is populated from the coder rather than empty.
- `schema-cache.test.ts` and `schema-cache.trails.test.ts` stay green.
