---
title: "database-tasks-adapters-carry-a-real-pool"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6213
claim: "2026-08-08T01:02:07Z"
assignee: "database-tasks-adapters-carry-a-real-pool"
blocked-by: null
closed-reason: null
---

## Context

Rails' database tasks never build a bare adapter: every one of them goes
through `establish_connection` + `ActiveRecord::Base.lease_connection`
(`vendor/rails/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:70-74`,
`.../sqlite_database_tasks.rb:15-37`), so the adapter they drive is always
checked out of a real pool and `connection.pool.db_config` /
`role` / `shard` / `inspect` answer as Ruby does
(`connection_adapters/abstract_adapter.rb:286-296`).

trails still constructs three of them bare, which leaves the constructor's
`NullPool` seed (`abstract-adapter.ts:833` = `abstract_adapter.rb:153`) in
place:

- `packages/activerecord/src/tasks/mysql-database-tasks.ts:154` (`truncateAll`)
- `packages/activerecord/src/tasks/mysql-database-tasks.ts:226` (`savedCharset`)
- `packages/activerecord/src/tasks/sqlite-database-tasks.ts:279` (`connectAdapter`)

Surfaced while closing `template-global-setup-adapters-carry-a-real-pool`,
which routed the three `support/template-global-setup.ts` sites through a real
`ConnectionPool`. `connection-adapters/mysql2-adapter.ts:360`
(`Mysql2Adapter.databaseExists`) was checked in the same pass and is **already
faithful** — Rails' `self.database_exists?(config)` is a bare
`new(config).database_exists?` (`abstract_adapter.rb:358-364`), no pool — so it
is deliberately excluded here.

This is the last set of pool-less adapter constructions blocking
`abstract-adapter-role-shard-cast-hides-ruby-nomethoderror`, whose reader cast
can only be deleted once every site is gone.

## Acceptance criteria

- [ ] The three `tasks/` sites obtain their adapter through a real pool, in the
      shape Rails uses (`establish_connection` → `lease_connection`) rather than
      a bespoke pool built inline.
- [ ] `Mysql2Adapter.databaseExists` is left bare, matching
      `abstract_adapter.rb:358-364`.
- [ ] No test renamed; all AR lanes green.
