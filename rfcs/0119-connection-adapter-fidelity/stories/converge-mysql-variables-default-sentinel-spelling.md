---
title: 'Accept only Rails'' ":default" sentinel for MySQL session variables'
status: done
updated: 2026-08-31
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7243
claim: "2026-08-30T14:57:57Z"
assignee: "integer-cast-value-is-a-rescue-not-a-probe"
blocked-by: null
closed-reason: null
---

## Context

`AbstractMysqlAdapter#configure_connection` builds its sentinel set as
`defaults = [":default", :default].to_set`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:921`)
— the `database.yml` spelling `":default"` and the Ruby Symbol, which is the
same `":default"` string under this repo's Symbol convention (CLAUDE.md, "A Ruby
Symbol is a JS string"). Rails does NOT accept the bare string `"default"`.

trails' `Mysql2Adapter` spells it
`const DEFAULTS = new Set([":default", "default"]);`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:1650`), so it
accepts a spelling Rails rejects. The `variables` option type carries the same
extra arm (`pool-config.ts:430`), and
`packages/activerecord/src/adapters/abstract-mysql-adapter/connection.test.ts:269`
passes `{ default_week_format: "default" }`.

This is the MySQL sibling of the PostgreSQL deviation converged by
`converge-pg-variables-default-sentinel-spelling` (RFC 0119); it was left alone
there only because that story is PG-scoped.

## Acceptance criteria

- [ ] `DEFAULTS` matches abstract_mysql_adapter.rb:921 — `":default"` only.
- [ ] `TrailsAdapterOptions["variables"]` (pool-config.ts) drops the bare
      `"default"` arm.
- [ ] The `strict: "default"` arm is checked against
      `type_cast_config_to_boolean` and converged or cited.
- [ ] MySQL/MariaDB lane green.
