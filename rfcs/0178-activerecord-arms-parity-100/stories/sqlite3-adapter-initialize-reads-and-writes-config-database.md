---
title: "activerecord: SQLite3Adapter#initialize reads and writes @config[:database] in place of a filename local"
status: ready
updated: 2026-10-09
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

`SQLite3Adapter#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:102-131`)
calls `super`, then switches on `@config[:database].to_s`, writes the expanded path back with
`@config[:database] = File.expand_path(@config[:database], Rails.root)`, and builds
`@connection_parameters = @config.merge(database: @config[:database].to_s, results_as_hash: true, default_transaction_mode: :immediate)`.

The trails constructor (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) strips
`database` out of the config before `super`, carries the path in an invented local `filename`, never
writes it back to the config, and merges `database: filename`. trails#8731's call-args comparer fix
surfaced the last of those as a kwarg-nested naming pair (`to_s` against `filename`), which now
carries `@missingRailsName toS — PERMANENT` on the constructor.

## Acceptance criteria

- [ ] The constructor passes the whole config to `super`, reads and writes `this._config.database`
      as Rails reads and writes `@config[:database]`, and merges `database: toS(this._config.database)`,
      with no `filename` local.
- [ ] The `@missingRailsName toS` receipt on the constructor is deleted.
- [ ] `pnpm parity:api:calls:args` green; the sqlite adapter tests green.
