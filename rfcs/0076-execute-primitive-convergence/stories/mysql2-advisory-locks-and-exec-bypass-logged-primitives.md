---
title: "mysql2 advisory locks and exec issue SQL off the logged primitives"
status: draft
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two `Mysql2Adapter` members issue SQL straight on the driver handle instead of
through a logged primitive, so their queries appear in no `sql.active_record`
notification, no query log, and no `assertQueries` count:

- `getAdvisoryLock` / `releaseAdvisoryLock`
  (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`) do
  `const conn = await this.getConn(); conn.query("SELECT GET_LOCK(?, 0) …")`.
  Rails is `query_value("SELECT GET_LOCK(#{quote(lock_name.to_s)}, #{timeout})") == 1`
  and `query_value("SELECT RELEASE_LOCK(#{quote(lock_name.to_s)})") == 1`
  (`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:181-187`).
  Note Rails interpolates a _quoted_ name and takes `timeout` as a parameter;
  trails hardcodes `0` and binds.
- `exec(sql)` does `this._syncDatabaseTimezone(); const conn = await this.getConn();
conn.query(this.mysqlQuote(sql))`. It has no Rails counterpart at all — DDL in
  Rails goes through `execute`.

PR #6313 rerouted both off the bare `_ensureClient` and onto `getConn`, which now
establishes through the `connect!`/`verify!` lifecycle, so neither can reach an
unconfigured socket any more. That fixed the socket half; the primitive-bypass
half is untouched and is what this story converges.

## Converged shape

`getAdvisoryLock` / `releaseAdvisoryLock` become `queryValue` calls with the
Rails argument shape (`lockName`, `timeout = 0`, quoted-interpolated, compared
`=== 1`). `exec` either collapses into `execute` or, if a caller genuinely needs
the raw handle, is justified at the call site — it is unmeasured surface today
(`pnpm parity:api:extra` lists `exec` as one of mysql2-adapter.ts's two novel names,
and sqlite3/postgresql carry the same invented `exec`).

## Acceptance criteria

- [ ] Advisory locks issue their SQL through `queryValue`, with Rails' parameter
      list and quoting (`abstract_mysql_adapter.rb:181-187`).
- [ ] `exec` is removed, or reduced to a documented call-site deviation; the
      `parity:api:extra` novel count for mysql2-adapter.ts drops accordingly.
- [ ] The advisory-lock queries appear in the notification stream (an
      `assertQueries`-style guard proves it).
