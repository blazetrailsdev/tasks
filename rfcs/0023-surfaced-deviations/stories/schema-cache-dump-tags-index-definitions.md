---
title: "schema-cache-dump-tags-index-definitions"
status: draft
updated: 2026-09-28
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SchemaCache#dump_to` writes `YAML.dump(self)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:406`),
so each `IndexDefinition` (`abstract/schema_definitions.rb:8`, which defines no
`encode_with`) is dumped as `!ruby/object:ActiveRecord::ConnectionAdapters::IndexDefinition`
with its instance variables. `_load_from` (`schema_cache.rb:228-240`) revives it
from the tag.

Since trails#8229, trails dumps Column and SqlTypeMetadata the same way, through
`RUBY_OBJECT_TAGS` in `packages/activerecord/src/connection-adapters/schema-cache.ts`.
Indexes are the one exception. They are still dumped as untagged plain maps, and
`rehydrateIndex` / `expandIndexOption` (`schema-cache.ts`, around `:81`)
rebuild them through `new IndexDefinition(...)` from a hand-listed set of keys.
Rails has neither helper.

## Acceptance criteria

- `IndexDefinition` joins `RUBY_OBJECT_CLASSES`, and its ivars round-trip under
  the `!ruby/object:ActiveRecord::ConnectionAdapters::IndexDefinition` tag.
- `rehydrateIndex` and `expandIndexOption` are deleted. `_loadFrom` assigns
  `indexes` from the parsed dump, as it already does for `columns`.
- `SchemaCacheIndexDefinitionRoundTripTest` in `schema-cache.trails.test.ts` still passes.
