---
title: "converge-sqlite3-connection-parameters-merge"
status: draft
updated: 2026-09-10
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
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

Rails builds the SQLite3 connection parameters with a `Hash#merge` over the
config (`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`,
`initialize`):

```ruby
@connection_parameters = @config.merge(
  database: @config[:database].to_s,
  results_as_hash: true,
  default_transaction_mode: :immediate,
)
```

trails builds the same hash with an object spread
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, the
constructor's `this._connectionParameters = { ...this._config, … }`), so the
call gate sees no `merge`. That omission is tracked by a
`@missingRailsCall merge — CONVERGEABLE` receipt on the constructor. Until now
the receipt pointed at `converge-sqlite3-adapter-construction-call-set-rows`,
which is already done (PR 7009).

`merge` from `@blazetrails/ruby-compat` (`packages/ruby-compat/src/hash.ts:116`)
returns `Record<string, T>`, and `merge` from `@blazetrails/activesupport`
(`hash-utils.ts:65`) returns the receiver's type. Neither returns
`SQLite3ConnectionParameters`, so a straight call needs a typing answer rather
than a cast.

## Acceptance criteria

- [ ] `_connectionParameters` is built via a `merge` call mirroring
      `sqlite3_adapter.rb`'s `@config.merge(...)`, with no `as` cast introduced.
- [ ] The `@missingRailsCall merge` receipt on the SQLite3Adapter constructor is
      deleted.
- [ ] `pnpm parity:api:calls` green; sqlite3 suites green.
