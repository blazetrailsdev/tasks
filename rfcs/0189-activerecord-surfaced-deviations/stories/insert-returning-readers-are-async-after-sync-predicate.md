---
title: "activerecord: return_value_after_insert? / last_inserted_id / returning_column_values are still async"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 120
priority: 62
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8858 made `supportsInsertReturning` synchronous. Three readers that were
`async` only because they awaited it are still `async`, where Rails' are plain
methods:

- `return_value_after_insert?`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:558-560`,
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:177-179`)
  is `returnValueAfterInsert(): Promise<boolean>` in `abstract-adapter.ts` and
  `abstract-mysql-adapter.ts`. The MySQL one also awaits `databaseVersion`
  before the peek, with no receipt. `model-schema.ts` awaits it per column.
- `last_inserted_id`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:23-29`)
  is `async` in `mysql2/database-statements.ts`.
- `returning_column_values`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql/database_statements.rb:58-64`,
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:723-725`)
  is `async` in `mysql/database-statements.ts` and
  `abstract/database-statements.ts`.

`InsertAll`'s fact step in `insert-all.ts` also awaits `connection.databaseVersion`
ahead of the peek, with no receipt at the site.

## Acceptance criteria

- [ ] `returnValueAfterInsert`, `lastInsertedId` and `returningColumnValues`
      return synchronously on every adapter, with Rails' bodies, and their
      callers drop the `await`.
- [ ] The version warm-up that `returnValueAfterInsert` and `InsertAll` need on
      a never-connected pool either moves to a step that is already awaited or
      carries a receipt at the site against packages/activerecord/CLAUDE.md,
      "Adapter facts are prewarmed and peeked".
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:throws` stay green.

## Audit 2026-10-22

Current sites (2026-10-22): `abstract-adapter.ts:1334`,
`abstract-mysql-adapter.ts:304`, `mysql2/database-statements.ts:97`,
`mysql/database-statements.ts:103`.
