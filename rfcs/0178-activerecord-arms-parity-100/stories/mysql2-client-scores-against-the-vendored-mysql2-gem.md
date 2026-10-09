---
title: "mysql2-client-scores-against-the-vendored-mysql2-gem"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8728 (story `mysql2-perform-query-takes-rails-control-flow-over-a-gem-shaped-raw-connection`)
gave the npm `mysql2` connection the Ruby gem's surface so `Mysql2::DatabaseStatements#perform_query`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:41-109`)
reads Rails' arms. The surface lives in
`packages/activerecord/src/connection-adapters/mysql2/mysql2-client.ts`:

- `mysql2Client(client)` decorates the npm connection in place with `query(sql)` (a `Mysql2Result` or
  `null`), `prepare(sql)` (a `Mysql2Statement`), `affectedRows`, `lastId`, `abandonResultsBang`,
  `setServerOption`, `queryOptions`, `readTimeout` and `automaticClose`.
- `Mysql2Result` (`fields`, `size`, `toA`) and `Mysql2Statement` (`execute`, `affectedRows`, `close`).
- `Mysql2.Client` holds the `MULTI_STATEMENTS` / `OPTION_MULTI_STATEMENTS_ON` /
  `OPTION_MULTI_STATEMENTS_OFF` constants.

`Mysql2Adapter.newClient` (`connection-adapters/mysql2-adapter.ts`) still translates the config for
`mysql.createConnection` in line, where Rails is `::Mysql2::Client.new(config)`
(`mysql2_adapter.rb:24-26`). Its `@inventedArm filter` / `if` receipts point here: the translation belongs
behind a gem-shaped `Mysql2.Client.new`.

None of it is scored. The mysql2 gem is not vendored (`vendor/` has `pg` and `sqlite3`, no `mysql2`), so
`parity:api` maps no Ruby file onto `mysql2-client.ts` and the three novel names carry
`@noRailsEquivalent CONVERGEABLE` receipts pointing here. The names were written from memory of the gem's
`lib/mysql2/client.rb`, `ext/mysql2/client.c`, `statement.c` and `result.c`, not checked against it.

`packages/activerecord/src/pg/connection.ts` is the prior art: trails#8687 vendored the pg gem and scored
`PG::Connection` against it.

Known gaps to check against the gem once it is vendored:

- `Mysql2::Client#warning_count` is not on the client. `AbstractMysqlAdapter#warningCount`
  (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`) still runs
  `SHOW COUNT(*) WARNINGS`, where Rails reads `@raw_connection.warning_count`
  (`abstract_mysql_adapter.rb:771-773`).
- `Mysql2Statement#execute` formats a Time bind through `quotedDate` with `queryOptions.databaseTimezone`;
  the gem's `statement.c` conversion has not been compared.
- `abandonResultsBang` has an empty body, because the npm client has read every result set by the time
  `query` resolves.
- `setServerOption` writes `COM_SET_OPTION` through the npm connection's command queue with a hand-built
  packet, since node-mysql2 ships no command class for it.

## Acceptance criteria

- [ ] The mysql2 gem is vendored under `vendor/mysql2/<version>/` and `mysql2-client.ts` is laid out and
      scored against it, as `pg/connection.ts` is against the pg gem.
- [ ] The `@noRailsEquivalent CONVERGEABLE` receipts in `mysql2-client.ts` are gone, each name either
      credited to a gem member or deleted.
- [ ] `Client#warning_count` is ported and read where Rails reads it.
- [ ] `newClient` is `Mysql2.Client.new(config)` plus Rails' rescue, with no `@inventedArm` receipt.
