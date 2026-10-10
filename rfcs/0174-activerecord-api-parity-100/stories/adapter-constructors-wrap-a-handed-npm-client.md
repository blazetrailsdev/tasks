---
title: "adapter-constructors-wrap-a-handed-npm-client"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

Surfaced by review of trails PR 8763. Rails' adapter `initialize` stores a handed driver connection as
it is: `@unconfigured_connection = config_or_deprecated_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:127-150`),
and `Mysql2Adapter#initialize` / `PostgreSQLAdapter#initialize` make no further call on it.

In trails the npm client is not gem-shaped until it is wrapped, so
`packages/activerecord/src/connection-adapters/mysql2-adapter.ts` and
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` each run
`this._unconfiguredConnection &&= mysql2Client(...)` / `pgConnection(...)` after `super(...)`. That is
a conditional and a call Rails' `initialize` does not make, receipted
`@inventedArm mysql2Client` / `@inventedArm pgConnection` against this story.

## Acceptance criteria

- [ ] The deprecated raw-connection overload takes a gem-shaped client (`Mysql2::Client` /
      `PG::Connection`, as Rails' does), so the constructors make no wrap call; or the repo owner rules
      the wrap permanent.
- [ ] Both `@inventedArm` receipts naming this story are deleted.
- [ ] `raw-connection-overload.trails.test.ts` and the two `adopted-raw-connection.trails.test.ts`
      files pass.
