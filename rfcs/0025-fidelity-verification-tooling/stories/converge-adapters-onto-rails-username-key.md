---
title: "converge-adapters-onto-rails-username-key"
status: ready
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

Rails' `database.yml` spells the credential `username`
(`vendor/rails/activerecord/lib/active_record/database_configurations/hash_config.rb`,
and every `config.example.yml` entry). trails is split on it:

- `MySQLDatabaseTasks#buildAdapterConfig` reads `this.resolvedField("username")`
  (`packages/activerecord/src/tasks/mysql-database-tasks.ts:257`), and
  `PostgreSQLDatabaseTasks` reads `c.username`
  (`packages/activerecord/src/tasks/postgresql-database-tasks.ts:238,294`) —
  both Rails-faithful.
- `Mysql2Adapter` and `PostgreSQLAdapter` forward the residual config hash
  straight to the `mysql2` / `pg` drivers
  (`mysql2-adapter.ts:549` `this._poolConfig = { ...mysqlConfig, ... }`;
  `postgresql-adapter.ts:568` `...pgConfig`), and both drivers read the
  driver-native `user`. Neither driver errors on an unknown key, so a config
  carrying only `username` connects as the **OS user** instead of failing.

This was masked while the test harness used a `UrlConfig`: each layer parsed
the credential out of the URL independently. PR for
`remove-test-url-sniffing-migrate-ci-onto-sub-settings` moved the harness to a
`HashConfig` and hit it as `Access denied for user ''@'...'` on the MySQL
slot-provisioning path under `AR_DB_FORKS`. It is worked around there by
emitting BOTH keys in `serverHash()`
(`packages/activerecord/src/test-helpers/test-database-config.ts`).

The duplication is the deviation: any user-supplied `database.yml`-style config
that spells the credential `username` (i.e. the Rails spelling) currently
fails to authenticate against both adapters, silently.

## Acceptance criteria

- `Mysql2Adapter` and `PostgreSQLAdapter` accept Rails' `username` key and map
  it to the driver-native `user` when building their driver config, so a
  Rails-spelled config hash authenticates correctly.
- An explicit `user` continues to work (precedence documented and tested).
- The duplicated `username` + `user` emission in `serverHash()` in
  `test-helpers/test-database-config.ts` is reduced to Rails' `username` alone,
  and the comment explaining the straddle is removed.
- Tests cover: `username`-only config connects; `user`-only config connects.
