---
title: "_shouldPrepare gates on statement_limit > 0; Rails gates only on prepared_statements"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6293
claim: "2026-08-09T19:09:16Z"
assignee: "mysql-quote-override-has-no-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

`Mysql2Adapter#_shouldPrepare` and `PostgreSQLAdapter`'s equivalent gate the
prepared-statement path on the statement-limit value as well as
`preparedStatements`:

```ts
private _shouldPrepare(binds: unknown[]): boolean {
  if (!this.preparedStatements || binds.length === 0) return false;
  const poolLimit = this._statementPool?.maxSize ?? this._statementLimit;
  return poolLimit > 0;
}
```

(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:301-306`,
`postgresql-adapter.ts:1674`.) The comment at the mysql2 site describes the
`statement_limit > 0` clause as an addition to Rails.

Rails gates only on `prepared_statements`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:234-237`,
`:1177`) and lets `StatementPool` handle a zero limit itself — `StatementPool#[]=`
evicts down to `max` (`connection_adapters/statement_pool.rb`), so a limit of 0
degrades inside the pool rather than by branching around it at the call site.
There is no `statement_limit > 0` test anywhere in the Rails adapters.

Surfaced while retiring the public `statementLimit` accessor in PR #6098, which
left the gate untouched.

## Converged shape

- `_shouldPrepare` (both adapters) tests `preparedStatements` and the bind
  count only, matching `abstract_adapter.rb:1177`.
- A `statement_limit: 0` configuration degrades through `StatementPool`, not
  through a call-site branch.
- The trails-only test "statementLimit = 0 disables named prepared statements"
  (`adapters/abstract-mysql-adapter/statement-pool.trails.test.ts`) is rewritten
  to whatever Rails' pool actually does at limit 0, or deleted with the invented
  behaviour.

## Acceptance criteria

- Neither adapter reads `_statementLimit` in its prepare gate.
- `pnpm parity:api:calls` / `parity:api:calls` stay green with no new baseline row.
