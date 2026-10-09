---
title: "activerecord: SQLite3 new_column_from_field is this-typed with Rails' reads and Column.new arguments"
status: in-progress
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8704
claim: "2026-10-09T12:28:18Z"
assignee: "sql-datetime-formatters-fold-into-quoted-date-and-quoted-time"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8390 (the `ca-drivers` receipt audit), which renamed the `default` local in this
body and left the rest.

`SQLite3::SchemaStatements#new_column_from_field`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb:143-169`)
is a private instance method: it calls `fetch_type_metadata`, `extract_value_from_default` and
`extract_default_function` on `self`, reads `field["dflt_value"]` and `field["type"]` raw, and passes
`default_function` to `Column.new` as the fifth positional argument (`:163`).

`packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts` `newColumnFromField`:

- takes the adapter as an explicit first parameter (`adapter: SQLite3SchemaAdapter`) where every other
  function in the file is `this`-typed, so its parameter list is one longer than Rails';
- normalises its reads: `(field["dflt_value"] as string | null) ?? null`, `String(field["type"] ?? "")`,
  `String(field["name"])`, `Boolean(field["auto_increment"])`;
- tests `if (generatedType)` where Rails has `generated_type.present?` (`:150`);
- passes `defaultFunction` inside the options object, as `defaultFunction ?? undefined`.

## Acceptance criteria

- [ ] `newColumnFromField` is `this`-typed with Rails' three parameters, and its callers follow.
- [ ] The reads are raw, `present?` is `isPresent`, and `Column.new` takes `default_function` where
      Rails passes it — or the sqlite `Column` constructor's own signature is filed if that is what
      forces the options shape.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` green with no new row; the SQLite
      column-reflection tests pass.

## Verification

```bash
pnpm parity:api:calls:args && pnpm parity:api:params
```
