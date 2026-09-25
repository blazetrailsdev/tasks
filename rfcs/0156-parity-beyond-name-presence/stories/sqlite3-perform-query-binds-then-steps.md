---
title: "sqlite3 perform_query binds before the column_count branch and steps the non-reader arm"
status: draft
updated: 2026-09-25
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3::DatabaseStatements#perform_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:76-110`)
has two statement arms. Each one binds and THEN branches on `column_count.zero?`:

- prepared: `stmt = @statements[sql] ||= raw_connection.prepare(sql)`;
  `stmt.reset!`; `stmt.bind_params(type_casted_binds)`; then
  `stmt.column_count.zero?` → `stmt.step; ActiveRecord::Result.empty`, else
  `ActiveRecord::Result.new(stmt.columns, stmt.to_a)`;
- unprepared: `stmt = raw_connection.prepare(sql)`;
  `stmt.bind_params(type_casted_binds) unless binds.nil? || binds.empty?`; the
  same branch; `ensure stmt.close`.

trails#8071 added `bindParams` / `toA` to `SqliteStatement` (every driver) and
routes the reader arm through them. The rest of trails' `performQuery`
(`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts`)
still differs:

- both arms are folded into one (`prepare ? _cachedStatement : _freshStatement`);
- `bindParams` is called only inside the reader arm, and never under the
  `unless binds.nil? || binds.empty?` guard;
- the non-reader arm is `stmt.run(typeCastedBinds)`, where Rails has
  `stmt.step` over the already-bound params;
- `stmt.reset!` has no call.

## Acceptance criteria

- [ ] `SqliteStatement` gains sqlite3-ruby's `step` (and `reset!` → `resetBang`
      if the drivers can express it; `vendor/sqlite3/lib/sqlite3/statement.rb`).
      Each driver answers them over its bound params.
- [ ] `performQuery` binds before the `column_count.zero?` branch, with the
      unprepared arm's `unless binds.nil? || binds.empty?` guard. The
      non-reader arm is `stmt.step`, and the two arms follow
      `database_statements.rb:80-104` in order.
- [ ] `pnpm parity:api:calls` / `calls:args` stay green, and the
      `sqlite-drivers` driver tests pass on each driver.
