---
title: "SchemaCache#marshal_dump/#marshal_load assign raw members, no per-column conversion"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8113
claim: "2026-09-25T21:47:29Z"
assignee: "activemodel-error-message-nil-raw-type-cast-to-string"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8087, which moved column/index (de)serialization out of `SchemaCache#initWith` / `#encodeWith` and onto the YAML boundary (`_loadFrom` / `dumpTo`).

`SchemaCache#marshal_dump` / `#marshal_load` (`activerecord/lib/active_record/connection_adapters/schema_cache.rb:416-425`) are plain assignments:

```ruby
def marshal_dump
  [@version, @columns, {}, @primary_keys, @data_sources, @indexes]
end

def marshal_load(array)
  @version, @columns, _columns_hash, @primary_keys, @data_sources, @indexes, _database_version = array
  @indexes ||= {}
  derive_columns_hash_and_deduplicate_values
end
```

trails' `marshalDump` / `marshalLoad` (`packages/activerecord/src/connection-adapters/schema-cache.ts`) still run `serializeColumn` / `rehydrateColumn` / `rehydrateIndex` per member and convert Maps to objects. That is the same misplaced JSON-persistence step #8087 removed from `init_with`. Rails reaches Marshal through `_load_from` / `dump_to`'s `filename.include?(".dump")` arm (`:228-240`, `:406-414`), and trails has no such arm.

## Acceptance criteria

- `marshalDump` returns `[version, columns, new Map(), primaryKeys, dataSources, indexes]` and `marshalLoad` destructures and assigns, with `indexes ?? new Map()`, then derives. Neither does per-member conversion.
- Any byte-level conversion lives where trails actually serializes: a `.dump` arm in `_loadFrom` / `dumpTo` if one is ported, otherwise the caller that needs it.
- The `marshal dump and load` tests in `schema-cache.test.ts` stay green.
