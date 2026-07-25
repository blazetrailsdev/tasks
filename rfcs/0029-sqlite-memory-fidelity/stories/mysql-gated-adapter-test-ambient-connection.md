---
title: "adapter.test.ts: MySQL-gated AdapterTest block should lease the ambient connection"
status: done
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5303
claim: "2026-07-25T13:34:54Z"
assignee: "mysql-gated-adapter-test-ambient-connection"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AdapterTest` leases the ambient connection in `setup`
(`vendor/rails/activerecord/test/cases/adapter_test.rb:13`:
`@connection = ActiveRecord::Base.lease_connection`), and the MySQL-gated
cases inside `if current_adapter?(:Mysql2Adapter)` use that same
`@connection` — see `charset` / `collation` / `show_variable`
(`adapter_test.rb:143-158`).

trails splits those cases into a separate `describeIfMysql("AdapterTest", ...)`
block in `packages/activerecord/src/adapter.test.ts:1259-1317`, which builds
its own adapter in `beforeEach`:

```ts
adapter = new Mysql2Adapter(MYSQL_TEST_URL);
```

This is deliberate — the block runs under every `ARCONN` (it probes the MySQL
server directly rather than gating on the ambient adapter), so it cannot read
`Base`'s ambient config when `ARCONN=sqlite3`. But it means these cases never
exercise the leased pool connection Rails uses, and the pool/config plumbing
(`configure_connection`, pool settings, `prepared_statements`) is bypassed.

Relatedly, `not specifying database name for cross database selects`
(`adapter.test.ts:1284-1317`) mirrors Rails'
`db_config.configuration_hash.except(:database)` (`adapter_test.rb:163`) by
clearing the path off `MYSQL_TEST_URL` rather than deriving from a config hash
and dropping the `database` key.

Found while porting `disable prepared statements` to the ambient config
(#5284); left out of that PR to keep it scoped to the one story.

## Acceptance criteria

- [ ] Decide (and record at the call site) whether the MySQL-gated `AdapterTest`
      block should run only under `ARCONN=mysql2` against the ambient
      `Base.connection`, matching Rails' `current_adapter?` gate, rather than
      under every ARCONN against a self-built adapter.
- [ ] If so, the block leases the ambient connection like Rails' `setup` does,
      and `describeIfMysql` is narrowed accordingly.
- [ ] The cross-database-selects case derives its no-database connection from
      the ambient/derived config hash with `database` removed, mirroring
      `except(:database)`, instead of URL path manipulation.
- [ ] Test names unchanged; CI green on all three adapters.
