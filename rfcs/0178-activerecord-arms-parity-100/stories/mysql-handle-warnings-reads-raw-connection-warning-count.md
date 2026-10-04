---
title: "activerecord: MySQL handle_warnings reads @raw_connection.warning_count, not a SHOW COUNT(*) WARNINGS helper"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8490 (`activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1`).

Rails' `AbstractMysqlAdapter#handle_warnings`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:770-784`)
reads the driver handle's own counter twice, with no query:

```ruby
return if ActiveRecord.db_warnings_action.nil? || @raw_connection.warning_count == 0

warning_count = @raw_connection.warning_count
result = @raw_connection.query("SHOW WARNINGS")
```

`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts#handleWarnings` now has
Rails' one guard and second read, but both go through an invented protected helper,
`warningCount(rawConnection)` (bottom of the same file), which returns `rawConnection.warningCount`
when it is a number and otherwise runs `SHOW COUNT(*) WARNINGS`. Since #8490 that fallback query
runs twice per statement whenever `dbWarningsAction` is set and the npm `mysql2` handle carries no
numeric `warningCount`. The helper also has no Rails counterpart (`parity:api:extra` does not flag
it because it is `protected`).

The `SHOW WARNINGS` rows are also read as `{ Level, Code, Message }` objects with `?? null` /
`?? ""` defaults, where Rails destructures `|level, code, message|` from array rows.

## Acceptance criteria

- [ ] The mysql2 client boundary exposes `warning_count` on the raw connection (the npm driver reports `warningStatus` on each result header), so `handleWarnings` reads `this._connection.warningCount` twice as Rails does and issues no `SHOW COUNT(*) WARNINGS`.
- [ ] The `warningCount(rawConnection)` helper is deleted.
- [ ] The `SHOW WARNINGS` loop takes `level, code, message` from each row with no invented defaults.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:report --package=activerecord` show no new row for `handleWarnings`.
