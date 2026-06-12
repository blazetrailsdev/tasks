---
title: "Extract MySQL schema-statement implementations from mysql2-adapter into mysql/schema-statements"
status: draft
updated: 2026-06-12
rfc: "0000-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/mysql2-adapter.ts` is 1,385
code lines vs Rails' `mysql2_adapter.rb` at 155 — Rails keeps the MySQL logic
in `abstract_mysql_adapter.rb` plus the shared `mysql/` modules, and the
trails `connection-adapters/mysql/` directory mirrors Rails file-for-file, but
`mysql/schema-statements.ts` is interface-only. The implementations sit inline
in the adapter: `columns` (~153 lines), `defaultPreparedStatements` (~154),
`indexes` (~87), `foreignKeys` (~58), `parseMysqlName`, plus an inline
`MysqlSchemaStatements extends SchemaStatements` class at the top of the file.

Pure code motion, mirror of the PG extraction stories: move the inline
implementations (and the inline `MysqlSchemaStatements` class) into
`connection-adapters/mysql/schema-statements.ts` / a sibling class file,
leaving the adapter delegating. Driver glue (connect-error translation, URI
parsing, mysql2-npm type mapping) stays in the adapter — in Ruby that lives in
the `mysql2` gem, so the adapter is its faithful home.

## Acceptance criteria

- [ ] Schema-statement implementations live under `connection-adapters/mysql/`;
      the adapter only delegates; the inline `MysqlSchemaStatements` class is
      gone from `mysql2-adapter.ts`.
- [ ] No behavior change: no test edits beyond import paths; CI green on all
      three adapters.
- [ ] Diff under the 500 LOC ceiling (pure motion; excluding `.md`).

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb`
(`indexes`, `remove_column`, `create_table`, `remove_foreign_key`,
`internal_string_options_for_primary_key`, `type_to_sql`, …). Methods shared
with MariaDB belong in `abstract-mysql-adapter.ts` (already a healthy 1.7×) —
only move what Rails keeps in the `mysql/` modules.
