---
title: "SQLite3 _connectionParameters carries a driver key Rails' merge does not produce"
status: draft
updated: 2026-09-10
rfc: "0094-sqlite3-adapter-construction-fidelity"
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

Rails builds `@connection_parameters` from the config alone
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:128-132`):

```ruby
@connection_parameters = @config.merge(
  database: @config[:database].to_s,
  results_as_hash: true,
  default_transaction_mode: :immediate,
)
```

and `new_client` hands it to the one driver the gem has
(`sqlite3_adapter.rb:34-35`, `::SQLite3::Database.new(config[:database].to_s, config)`).

PR #7662 ported that merge into `SQLite3Adapter`'s constructor
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`), but the
static `newClient` has no way to pick one of trails' pluggable drivers, so the
merge also injects `driver: this.resolveDriverFactory()`. The instance-level
`defaultSqliteDriver()` hook overridden by every concrete adapter
(`better-sqlite3-adapter.ts`, `node-sqlite-adapter.ts`, `libsql-adapter.ts`, …)
is the reason the resolution cannot happen inside `newClient`.

## Converged shape

`_connectionParameters` holds exactly Rails' merge: config plus `database`,
`resultsAsHash` and `defaultTransactionMode`. `newClient` resolves the driver
itself from `config.driver` or the receiving class, because
`connect` already dispatches through `this.constructor`, the way Rails' `self.class.new_client` does
(`sqlite3_adapter.rb:806-807`). That means making the default-driver hook a
static on the concrete adapter classes.

## Acceptance criteria

- [ ] `_connectionParameters` carries no key Rails' merge at
      `sqlite3_adapter.rb:128-132` does not produce.
- [ ] `newClient` opens the right driver for every concrete adapter subclass
      with only `_connectionParameters` as input.
- [ ] SQLite adapter suites green on every driver lane.
