---
title: "template-global-setup-adapters-carry-a-real-pool"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6211
claim: "2026-08-08T00:38:05Z"
assignee: "template-global-setup-adapters-carry-a-real-pool"
blocked-by: null
closed-reason: null
---

## Context

`support/template-global-setup.ts:120,189,313` constructs bootstrap adapters
bare, so each carries the constructor's `NullPool` seed
(`abstract-adapter.ts:833` = `abstract_adapter.rb:153`) and would read
`undefined` from `role` / `shard` / `inspect()` where Ruby's bare `@pool.role`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:286-296`)
raises `NoMethodError`.

The task/CLI half of this set was closed by
`create-and-migrate-adapters-carry-a-real-pool` (PR #6197), which routed
`createAndMigrate`'s adapters through a real pool so `Migrator`'s
`record_environment` reads the pool as Rails does. This story applies the same
treatment to the template global-setup sites, which run before any lane's
primary pool exists.

Blocks `abstract-adapter-role-shard-cast-hides-ruby-nomethoderror`, whose reader
cast can only be deleted once the last pool-less site is gone.

## Acceptance criteria

- [ ] The three `template-global-setup.ts` sites obtain their adapters through a
      real `ConnectionPool`.
- [ ] `tasks/mysql-database-tasks.ts:154,226`, `tasks/sqlite-database-tasks.ts:279`
      and `mysql2-adapter.ts:360` are re-checked against the post-#6197 state and
      either converged here or confirmed already routed.
- [ ] No test renamed; all AR lanes green.
