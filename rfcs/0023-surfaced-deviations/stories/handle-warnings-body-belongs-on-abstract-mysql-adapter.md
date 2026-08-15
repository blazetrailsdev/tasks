---
title: "handle_warnings body sits on Mysql2Adapter while its warning_ignored? guard sits on AbstractMysqlAdapter, where Rails puts both"
status: draft
updated: 2026-08-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Baselined in PR #6577 (RFC 0106 wave 3b): four rows —
`handle_warnings | query`, `| new`, `| warning_ignored?`, `| call` — in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`.

Rails defines `handle_warnings` on `AbstractMysqlAdapter`
(`abstract_mysql_adapter.rb:770-784`), reading `@raw_connection` directly:

    def handle_warnings(sql)
      return if ActiveRecord.db_warnings_action.nil? || @raw_connection.warning_count == 0

      warning_count = @raw_connection.warning_count
      result = @raw_connection.query("SHOW WARNINGS")
      result = [["Warning", nil, "Query had warning_count=... "]] if result.count == 0
      result.each do |level, code, message|
        warning = SQLWarning.new(message, code, level, sql, @pool)
        next if warning_ignored?(warning)
        ActiveRecord.db_warnings_action.call(warning)
      end
    end

trails leaves `AbstractMysqlAdapter#handleWarnings`
(`abstract-mysql-adapter.ts:1590`) as a two-line delegation to a `_handleWarnings`
hook, and puts the whole body on `Mysql2Adapter#handleWarnings`
(`mysql2-adapter.ts:1767`), because the raw mysql2 connection is reached there
as `this._client`.

`warning_ignored?` (rb:786-788) IS correctly on the abstract class in trails
(`isWarningIgnored`, abstract-mysql-adapter.ts:1600), so the file is
inconsistent with itself: the guard is at the Rails location and the body it
guards is one class down.

Related, already done: `mysql2-handle-warnings-drops-conn-parameter` (RFC 0076).

## Converged shape

The `handle_warnings` body lives on `AbstractMysqlAdapter` at the Rails
location, reading the raw connection through whatever seam RFC 0076 settles for
`@raw_connection` on this class. `Mysql2Adapter` keeps only what is genuinely
driver-specific (the `warning_count` read, if the mysql2 client exposes it
differently), and the `_handleWarnings` indirection — which has no Rails
counterpart — is retired.

Also fold in the two TODOs left in the current body: `Rails.error.report(warning,
handled: true)` is unwired (PG's `handleWarnings` already does it), and the
`ActiveRecord.db_warnings_action` dispatch is spelled as a local `action`
variable with string arms rather than Rails' single `.call`.

## Acceptance criteria

- [ ] `handleWarnings` body sits on `AbstractMysqlAdapter`, mirroring rb:770-784
      line for line, same early return and same `next if warning_ignored?` guard.
- [ ] `_handleWarnings` is gone (it has no Rails counterpart).
- [ ] The four `handle_warnings` rows deleted by hand from the shard (no reseed).
- [ ] `db_warnings_action` `:raise` / `:log` / proc arms keep their existing tests.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
