---
title: "MySQL type_to_sql special-cases ten types Rails renders through super"
status: done
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7536
claim: "2026-09-05T21:26:49Z"
assignee: "adapter-class-guards-a-missing-adapter-rails-lets-resolve-raise"
blocked-by: null
closed-reason: null
---

## Context

`MySQL::SchemaStatements#type_to_sql`
(`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`)
special-cases `float`, `string`, `datetime`, `timestamp`, `time`, `date`,
`bigint`, `decimal`, `boolean` and `json` on top of the four arms Rails
writes.

Rails' override at
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:112-133`
handles ONLY `integer`, `text`, `blob` and `binary`, then falls to `super`
for everything else — the base body at
`abstract/schema_statements.rb:1385-1417` renders the rest from
`native_database_types` plus the `limit`/`precision`/`scale` rules. Every
extra arm in the port is a hand-rolled restatement of what that lookup
already produces, so a change to `MYSQL_NATIVE_DATABASE_TYPES` silently
fails to reach the ten specialized types.

Surfaced in PR #7327 (`schema-creation-manual-dispatch-and-delegation`),
which relocated this body from `MySQL::SchemaCreation` to the adapter
unchanged. The reviewer flagged it as pre-existing debt carried by the
move, out of that story's scope.

## Converged shape

Delete the ten extra `case` arms so the `default:` `super.typeToSql(...)`
renders them, keeping only `integer`, `text`, `blob`, `binary` and the
trailing `unsigned` suffix, exactly as `mysql/schema_statements.rb:112-133`
does. Any behaviour an arm carries that the base cannot produce belongs in
`MYSQL_NATIVE_DATABASE_TYPES`, which is where Rails keeps it.

## Acceptance criteria

- [ ] `MySQL::SchemaStatements#type_to_sql` has the four arms Rails has.
- [ ] The MySQL and MariaDB AR lanes stay green, including
      `schema-dumper.test.ts` and `migration.test.ts`.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
