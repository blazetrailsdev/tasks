---
title: "schema-dumper-valid-type-raise-on-unmapped-column"
status: ready
updated: 2026-07-09
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 212
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4801 made `Column#type` nil-faithful for an unmapped `sql_type` (Rails'
`SqlTypeMetadata#type` / `Value#type` are nil). This exposed that trails has **no
`valid_type?`/raise-and-abort machinery** in the schema dumper.

Rails' `SchemaDumper#table` (vendored
`activerecord/lib/active_record/schema_dumper.rb:196`) does, per column:

```ruby
raise StandardError, "Unknown type '#{column.sql_type}' for column '#{column.name}'" unless @connection.valid_type?(column.type)
```

`valid_type?` (`abstract_adapter.rb:262`) is `!native_database_types[type].nil?`
— for a nil `column.type` (unmapped/composite column) this is `false`, so Rails
**raises**, and `table`'s `rescue => e` (schema_dumper.rb:220-224) discards the
whole `create_table` body and emits:

```text
# Could not dump table "..." because of following StandardError
#   Unknown type '' for column '...'
```

trails instead silently coalesces a nil `col.type` to the `sqlType` name via
`schema-dumper.ts:244` (`col.type || col.sqlType || "unknown"`) — a pre-existing
pragmatic deviation, NOT Rails behavior. There is no `validType?` method and no
per-column raise/rescue in trails.

Relevant trails files:

- `packages/activerecord/src/schema-dumper.ts:244` (the coalesce)
- `packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts` (`table`/column loop)
- `packages/activerecord/src/connection-adapters/abstract-adapter.ts` (needs `validType?`)

## Acceptance criteria

- [ ] Add `validType?(type)` on the abstract adapter mirroring
      `abstract_adapter.rb:262` (`!nativeDatabaseTypes[type]`).
- [ ] The schema dumper's per-column loop raises `Unknown type '<sqlType>' for
column '<name>'` when `validType?(column.type)` is false, matching
      `schema_dumper.rb:196`.
- [ ] `table` wraps the body in a rescue that emits the Rails
      `# Could not dump table ... because of following StandardError` comment
      block and skips the table, matching `schema_dumper.rb:220-224`.
- [ ] Remove the `col.type || col.sqlType || "unknown"` nil-coalesce deviation at
      `schema-dumper.ts:244` once the raise path lands (a nil type must reach the
      dumper as nil so `validType?` can reject it).
- [ ] Test: an unmapped/composite-type column produces the "Could not dump table"
      comment, not a fabricated `t.column name, sqlType` line.
- [ ] test:compare non-negative.
