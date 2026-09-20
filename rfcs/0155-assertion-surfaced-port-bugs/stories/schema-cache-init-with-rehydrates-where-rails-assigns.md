---
title: "SchemaCache#initWith/#encodeWith convert columns where Rails only assigns"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaCache#init_with`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb:281-287`)
assigns each coder member straight through and does nothing else but the
`unless coder["deduplicated"]` guard:

```ruby
def init_with(coder) # :nodoc:
  @columns          = coder["columns"]
  @columns_hash     = coder["columns_hash"]
  @primary_keys     = coder["primary_keys"]
  @data_sources     = coder["data_sources"]
  @indexes          = coder["indexes"] || {}
  @version          = coder["version"]

  unless coder["deduplicated"]
    derive_columns_hash_and_deduplicate_values
  end
end
```

Its twin `#encode_with` (`:273-279`) is the same shape in reverse —
`coder["columns"] = @columns.sort.to_h`, with no per-column work at all.

trails' `initWith` / `encodeWith`
(`packages/activerecord/src/connection-adapters/schema-cache.ts`) each run a
per-member conversion Rails has no counterpart for: `rehydrateColumn` /
`rehydrateIndex` on the way in and `serializeColumn` on the way out. That is
trails' JSON-persistence step standing in for what Ruby gets free from YAML and
`Marshal` type tags — but it lives inside the ported `init_with` / `encode_with`
bodies, where Rails has nothing, instead of in the dump/load path that actually
needs it (`SchemaCache._loadFrom` / `#dump_to`, `schema_cache.rb:228-253` and
`:406-414`).

trails#7897 surfaced this: `test_encode_with_sorts_members`
(`vendor/rails/activerecord/test/cases/connection_adapters/schema_cache_test.rb:397-419`)
hands `init_with` a coder whose members are `[["z", nil], ["y", nil], ["x", nil]]`
— an array of pairs, values `nil`. Rails stores it and sorts it. trails crashed
in `rehydrateColumn` (`Cannot read properties of null`) and in `encodeWith`'s
`cols.map`. The PR made the three conversion sites tolerate a non-column value
and added `coderEntries` (receipted `@noRailsEquivalent PERMANENT`) so a Ruby
Hash's array-of-pairs form is accepted alongside the object form. That
unblocked the test but left the conversion where Rails has none.

## Converged shape

Move the column/index conversion out of `initWith` / `encodeWith` and into the
serialization boundary that Ruby's YAML/Marshal tags occupy:

- `initWith` assigns `coder["columns"]`, `coder["columns_hash"]`,
  `coder["primary_keys"]`, `coder["data_sources"]`, `coder["indexes"] ?? {}`
  and `coder["version"]` with no per-member mapping, keeping only the
  `deduplicated` guard.
- `encodeWith` is four `sort` + `to_h` assignments plus `version`.
- `rehydrateColumn` / `rehydrateIndex` run in `SchemaCache._loadFrom`
  (`:228-236`), beside the `JSON.parse`; `serializeColumn` runs in
  `SchemaCache#dumpTo` (`:406-414`), beside the `JSON.stringify` — the two
  places trails actually crosses the JSON boundary.

If that lands, `coderEntries` and the three `Array.isArray` / non-object guards
trails#7897 added all become dead and are deleted with it. Check whether
`marshalDump` / `marshalLoad` (which already do their own column
serialization) want the same treatment.

## Acceptance criteria

- `SchemaCache#initWith` and `#encodeWith` are line-for-line the Ruby bodies at
  `schema_cache.rb:273-287`, with no per-column or per-index conversion.
- The conversion runs at the JSON boundary instead; a `dumpTo` → `_loadFrom`
  round trip still returns real `Column` / `IndexDefinition` instances.
- `coderEntries` and its `@noRailsEquivalent` receipt are deleted, and
  `pnpm parity:api:extra:gate` stays green (activerecord is rowless).
- `packages/activerecord/src/connection-adapters/schema-cache.test.ts` and
  `schema-cache.trails.test.ts` stay green, `#encode_with sorts members`
  included.
