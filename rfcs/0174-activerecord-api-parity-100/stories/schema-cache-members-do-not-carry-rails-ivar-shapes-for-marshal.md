---
title: "Column, SqlTypeMetadata and IndexDefinition do not carry Rails' ivar names and value types, so a Marshal schema cache does not interoperate"
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `ruby-compat-has-no-marshal-for-schema-cache-and-debug`. A
schema-cache `.dump` holds each `Column`, `SqlTypeMetadata` and
`IndexDefinition` as `TYPE_OBJECT`: the class path plus its instance variables
(`vendor/ruby/v3.3.11/marshal.c:1111` `w_class(TYPE_OBJECT, …)`, read back at
`marshal.c:2249`). `SchemaCache#marshal_load`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:420-425`)
assigns them as they are, so the trails fields have to be the Rails ivars.
Three are not. Loading the Rails-written fixture
`packages/activerecord/src/test-helpers/support/schema_cache_fixtures/rails_8_0_2_sqlite3.dump`
(`Marshal.load(File.binread(path))`) shows each:

- **`SqlTypeMetadata#type` is a Symbol in Rails.** `@type=:integer`
  (`connection_adapters/sql_type_metadata.rb:11-17`) loads as `":integer"`,
  where `packages/activerecord/src/connection-adapters/sql-type-metadata.ts`
  holds `"integer"`. So `column.type` of a loaded Rails column is `":integer"`,
  and a trails-written dump stores a String where Rails stores a Symbol.
- **`SQLite3::Column`'s ivars are `@auto_increment`, `@rowid`,
  `@generated_type`** (`connection_adapters/sqlite3/column.rb:9-14`). trails'
  fields are `_autoIncrement` and `_generatedType`
  (`packages/activerecord/src/connection-adapters/sqlite3/column.ts:7-9`), which
  dump as `@_auto_increment` / `@_generated_type`. A loaded Rails column gets
  own fields `autoIncrement` / `generatedType`, and `isAutoIncrement()` reads
  `undefined`. `rbDeclareIvar` (`packages/ruby-compat/src/object.ts`) is the
  existing way to name a field's ivar. `MySQL::Column` and `PostgreSQL::Column`
  need the same check against `mysql/column.rb` and `postgresql/column.rb`.
- **`IndexDefinition`'s `@lengths`, `@orders`, `@opclasses` are Hashes**
  (`connection_adapters/abstract/schema_definitions.rb:26-34`). trails holds
  plain objects
  (`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`,
  `IndexDefinition`), which dump as Hashes and load as ruby-compat `Hash`
  (a `Map`). A reader that indexes `index.orders[column]` gets `undefined` from
  a cache loaded out of a `.dump`. trails also carries `algorithm` and
  `ifNotExists` fields that Rails has no ivar for, and they are dumped.

## Acceptance criteria

- [ ] `Marshal.dump` of a trails `SQLite3::Column`, `MySQL::Column`,
      `PostgreSQL::Column`, `SqlTypeMetadata` (and its two adapter subclasses)
      and `IndexDefinition` writes the ivar names and value types Rails 8.0.2
      writes, checked against bytes Ruby dumped.
- [ ] A cache loaded from the Rails-written fixture answers
      `column.type === "integer"`, `isAutoIncrement()` for `courses.id`, and
      index `orders` / `lengths` / `opclasses` readable the way the schema
      dumper reads them.
- [ ] `schema-cache.test.ts` and `schema-cache.trails.test.ts` stay green on
      all three adapters.

## Verification

`pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts packages/activerecord/src/connection-adapters/schema-cache.trails.test.ts`.
