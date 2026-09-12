---
title: "converge-create-schema-dumper-required-options"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares `create_schema_dumper(options)` with a REQUIRED `options` on every host:
`abstract/schema_statements.rb:1541`, `mysql/schema_statements.rb:107-109`,
`postgresql/schema_statements.rb:884`, `sqlite3/schema_statements.rb:122`.

trails gives it an `options: Record<string, unknown> = {}` default on all four:
`abstract/schema-statements.ts` `createSchemaDumper`, `mysql/schema-statements.ts`
`MysqlSchemaStatements#createSchemaDumper` (relocated in trails#7731),
`postgresql-adapter.ts` `createSchemaDumper`, and `sqlite3-adapter.ts` /
`sqlite3/schema-statements.ts` `createSchemaDumper`. Removing the default on only the MySQL
override fails TS2416, because a derived member cannot require more arguments than its base.
So the whole family has to converge together, and its zero-argument callers have to pass
`{}` as Rails callers do: `schema_dumper.rb` `connection.create_schema_dumper(generate_options(config))`.

Zero-argument callers today: `adapters/postgresql/extension-migration.test.ts:68`,
`adapters/postgresql/postgresql-adapter.trails.test.ts:131`,
`adapters/postgresql/schema.test.ts:730,772,787,806,826,841,992`, plus any in mysql/sqlite tests.

## Acceptance criteria

- `createSchemaDumper(options: Record<string, unknown>)` with no default on the abstract and all
  three adapter hosts.
- Every caller passes an options hash; where a Rails test calls
  `@connection.create_schema_dumper({})`, the port passes `{}`.
- `pnpm parity:api:params` / `parity:api:calls:args` stay green.
