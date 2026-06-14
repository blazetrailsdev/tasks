---
title: "MySQL foreignKeys: return composite FK columns as array and unquote_identifier on column/to_table"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during review of PR #3252 (relocation of `MysqlSchemaStatements` /
`foreignKeys` / `parseMysqlName` into `mysql/schema-statements.ts`). These are
**pre-existing** divergences from Rails in the MySQL `foreignKeys` introspection
helper — not regressions from that PR, which was pure code-motion.

`foreignKeys` lives in
`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`
(mirrors `ActiveRecord::ConnectionAdapters::MySQL::SchemaStatements#foreign_keys`,
`abstract_mysql_adapter.rb` ~L465–507).

Two deviations:

1. **Composite FK columns as comma-string, not Array.** For multi-column foreign
   keys our helper joins `column` and `primary_key` with `","` into a single
   string. Rails represents composite FK columns/primary-keys as Ruby Arrays in
   the `ForeignKeyDefinition` options. Downstream consumers (schema dump,
   `foreign_key_exists?`) expect the array shape for composites.

2. **No `unquote_identifier` on `column` / `to_table`.** Rails runs the
   `referenced_table_name` and `column_name` values through
   `unquote_identifier` before building the definition; we pass the raw
   information_schema values straight through. Identifiers containing backticks
   or qualified names won't match Rails' output.

## Acceptance criteria

- [ ] Composite foreign keys return `column` / `primaryKey` as arrays (matching
      Rails' `ForeignKeyDefinition` shape), single-column keys unchanged.
- [ ] `column` and `to_table` are passed through the equivalent of Rails'
      `unquote_identifier` before constructing `ForeignKeyDefinition`.
- [ ] Read the corresponding Rails test(s) first; mirror test names verbatim.
- [ ] CI green on all three adapters (MySQL path is the one exercised).
