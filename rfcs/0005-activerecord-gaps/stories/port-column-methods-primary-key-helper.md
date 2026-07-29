---
title: "Port ColumnMethods#primary_key to the table definition and change_table proxies"
status: draft
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ColumnMethods#primary_key` is a dedicated method on the table
definition and `change_table` proxies:

```ruby
def primary_key(name, type = :primary_key, **options)
  column(name, type, **options.merge(primary_key: true))
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:306-309`)
— it is defined **separately** from `define_column_methods`, takes the second
argument as the column type, and merges `primary_key: true`.

trails has no equivalent. `TableDefinition.primaryKey` at
`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1664`
is an unrelated async reader returning the table's primary-key name, and the
`Table` change_table proxy (:1442) defines nothing. So
`t.primary_key("id", "uuid")` has no faithful path.

Surfaced during PR #5570 review: `Migration#changeTable` was building its
column shorthands from `Object.keys(nativeDatabaseTypes())`, which includes
`primary_key`, so the name resolved to a generic `column(name, "primary_key")`
— dropping the `primary_key: true` merge and ignoring the type argument. That
PR fixed the _leak_ (shorthands now come from `columnMethodNames()`, and
`NON_COLUMN_METHOD_TYPES` excludes both spellings) but deliberately did not
implement the helper, which is this story.

## Acceptance criteria

- [ ] `primaryKey(name, type = "primary_key", options)` is implemented on the
      shared `ColumnMethods` surface so both `TableDefinition` (create_table)
      and `Table` (change_table) expose it, matching
      `schema_definitions.rb:306-309`: it delegates to `column()` with
      `{ ...options, primaryKey: true }`.
- [ ] It does not collide with the existing `TableDefinition.primaryKey`
      reader — resolve the name clash explicitly (Rails has no such reader on
      TableDefinition; check whether that reader is itself a trails invention
      and file separately if so).
- [ ] `NON_COLUMN_METHOD_TYPES` in `migration/command-recorder.ts` still
      excludes `primary_key`/`primaryKey` from the _generic_ shorthand set —
      the dedicated method is not a `define_column_methods` entry.
- [ ] Covered by a test asserting the type argument and the `primary_key: true`
      merge both take effect.
