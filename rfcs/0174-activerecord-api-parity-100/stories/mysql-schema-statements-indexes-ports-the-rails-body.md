---
title: "activerecord: MySQL::SchemaStatements#indexes ports the Rails body"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit: the receipt below was
`@missingRailsCall order:constructor,quoteColumnName — PERMANENT`, no CLAUDE.md section ratifies it, and
it is re-tagged `CONVERGEABLE` onto this story.

`MySQL::SchemaStatements#indexes`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:8-75`)
builds an array of argument lists while it walks `SHOW KEYS` (`indexes << [table, key_name, unique, [],
lengths: {}, orders: {}, type:, using:, comment:]`, `:24-34`), appends to `indexes.last` per row
(`:37-47`), and only then maps each list to `IndexDefinition.new(*index, **options)` (`:51-68`), calling
`quote_column_name` and `add_options_for_index_columns` for an expression index on the way.

`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts` `indexes` is a different body:

- It accumulates into a `Map` keyed by index name (`byIndex`) holding an invented record shape, where
  Rails has an ordered array and `indexes.last`.
- It reads every column under two spellings (`r.Key_name ?? r.KEY_NAME`, and so on for seven columns);
  Rails reads `row["Key_name"]`.
- `Index_type` defaults to `"BTREE"` when absent; Rails has no default (`:16`).
- The `rescue StatementInvalid` arm (`:69-75`) is a `try` around the query alone that matches the message
  of the error and of its `cause`, where Rails rescues the whole body and tests `e.message`.
- The order row itself: the `IndexDefinition` is constructed before `quoteColumnName` is reached.

## Acceptance criteria

- [ ] `indexes` is the Rails body, line for line: Rails' locals (`indexes`, `current_index`,
      `mysql_index_type`, `index_type`, `index_using`, `expression`, `options`, `orders`, `lengths`,
      `columns`), the `indexes.last` appends, and the final `map` to `IndexDefinition.new`.
- [ ] The double-spelled column reads and the `"BTREE"` default are gone, or each is filed with the
      driver behaviour that needs it.
- [ ] The `@missingRailsCall order:constructor,quoteColumnName` receipt is deleted;
      `pnpm parity:api:calls` green with no new row.
- [ ] The MySQL and MariaDB index reflection and schema-dumper tests pass on their lanes.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
