---
title: "Schema-cache dump restores the Column subclass without a class coder key"
status: draft
updated: 2026-09-16
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `column-coder-carries-a-class-tag-and-subclass-state` on 2026-09-16.

Rails' `Column#encode_with` writes seven keys and no class tag
(`vendor/rails/activerecord/lib/active_record/connection_adapters/column.rb:46-63`).
YAML restores the Column subclass from the document's `!ruby/object:` tag when
`SchemaCache#dump_to` writes the dump (`schema_cache.rb:406`).

trails' dump is JSON, so it carries no tag. Instead:

- `Column#encodeWith` (`packages/activerecord/src/connection-adapters/column.ts:120-121`)
  writes `coder["class"] = "Column"`.
- Each subclass override overwrites that key: `mysql/column.ts:33`,
  `postgresql/column.ts:107`, `sqlite3/column.ts:88`.
- `rehydrateColumn` (`connection-adapters/schema-cache.ts:37-44`) maps the key
  back to a class through `COLUMN_CLASSES` (`:30-35`).

Rails writes no such key.

There is a second residue in the same dump. trails keeps state on Column that
Rails keeps on the type metadata: PG `oid`/`fmod` and MySQL `extra`, which Rails
holds in `PostgreSQL::TypeMetadata` (`postgresql/type_metadata.rb:7-20`) and
`MySQL::TypeMetadata`. It also keeps SQLite3 `rowid`/`generated_type`, which Rails
loses in the dump. The dump cannot lose that state as Rails does, because the
fixtures warm installs a dump-loaded cache and `base_test.rb` `test_clear_cache!`
(`packages/activerecord/src/base.test.ts`, "clear cache!") compares it against a
reflected one. Dropping the state reds that test (measured on trails#6980).

## Acceptance criteria

- `Column#encodeWith` / `initWith` write and read exactly the keys at
  `column.rb:46-63`, with no `class` key. The subclass overrides write only their
  Ruby keys.
- The dump restores the Column subclass without a coder key, for example through
  an adapter-keyed lookup, since the loading adapter knows which Column class it
  builds. `COLUMN_CLASSES` has no coder participation.
- `oid`/`fmod`/`extra` live where Rails keeps them, on the type metadata.
- `base_test.rb` "clear cache!" passes on sqlite3, postgresql and mysql2. Each lane
  fails this test in a different way, so all three must be run.
- `support/schema-cache-dump.trails.test.ts` passes.
