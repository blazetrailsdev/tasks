---
title: "Derive abstract typeToSql string/type default limits from a per-adapter native-types table instead of adapterName branches"
status: claimed
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-07-06T03:06:20Z"
assignee: "derive-typetosql-limit-from-native-types-table"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #4640 review. `packages/activerecord/src/connection-adapters/abstract/schema-creation.ts` `typeToSql` hardcodes per-adapter default limits via `this.adapterName` branches (e.g. the `string` case now special-cases `mysql` for the implicit `varchar(255)`; `char` defaults to 1, etc.).

Rails instead derives the default generically: `abstract/schema_statements.rb:1404` does `limit ||= native[:limit]`, pulling the default from the adapter's own `NATIVE_DATABASE_TYPES` hash. Only MySQL's `:string` carries `limit: 255` (`abstract_mysql_adapter.rb:33`); sqlite3 (`sqlite3_adapter.rb:71`) and PostgreSQL (`postgresql_adapter.rb:136`) have none.

The current `adapterName`-branch approach works but duplicates the native-types knowledge and is easy to get wrong (the initial #4640 gate was inverted to `!== "sqlite"`, silently baking the MySQL default into PostgreSQL's `super.typeToSql` fallback path).

## Acceptance criteria

- Abstract `typeToSql` sources default limits from a per-adapter native-types table (mirroring `limit ||= native[:limit]`), not `adapterName` conditionals.
- Behavior preserved for all three adapters: MySQL string → `varchar(255)`, sqlite3/PostgreSQL string → unbounded `varchar` / `character varying`.
- Existing sqlite3/mysql/postgresql schema-creation and copy-table tests stay green.
