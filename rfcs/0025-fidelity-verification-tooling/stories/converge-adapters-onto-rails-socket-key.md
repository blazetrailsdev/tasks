---
title: "Converge Mysql2Adapter onto Rails' socket key"
status: ready
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling of `converge-adapters-onto-rails-username-key` — same root cause, same
fix site, different key. Both should land together.

Rails' config key for a Unix socket is `socket`
(`vendor/rails/activerecord/test/config.example.yml:18-19,37-39`, on both
`mysql2.arunit` and `mysql2.arunit2`). trails is split:

- `MySQLDatabaseTasks#buildAdapterConfig` reads `this.resolvedField("socket")`
  (`packages/activerecord/src/tasks/mysql-database-tasks.ts:249`) — Rails-faithful.
- `Mysql2Adapter` forwards the residual config hash to mysql2
  (`mysql2-adapter.ts:549`), whose driver option is `socketPath`
  (`node_modules/mysql2/typings/mysql/lib/Connection.d.ts:149`).

mysql2 ignores an unknown `socket` key rather than raising, so a Rails-spelled
config silently connects over TCP instead of the socket — the same silent-wrong-
connection failure as the `username` case.

Worked around in PR #4961 by emitting BOTH spellings from `driverConfig()`
(`packages/activerecord/src/test-helpers/test-connection-env.ts`).

## Acceptance criteria

- `Mysql2Adapter` accepts Rails' `socket` key and maps it to the driver's
  `socketPath`; an explicit `socketPath` continues to work, precedence tested.
- The duplicated `socket` + `socketPath` emission in `driverConfig()` collapses
  to Rails' `socket` alone, and the straddle comment is removed.
- Test proves a `socket`-only config reaches the socket (a bogus path must fail
  ENOENT, not silently succeed over TCP — that is the assertion that catches a
  regression here).
