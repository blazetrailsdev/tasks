---
title: "Converge ExecutionStrategy/DefaultStrategy onto Rails' method_missing delegator shape"
status: ready
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
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

`packages/activerecord/src/migration/execution-strategy.ts` and
`migration/default-strategy.ts` do not match Rails. Rails'
`ExecutionStrategy` (`vendor/rails/activerecord/lib/active_record/migration/execution_strategy.rb`)
is a plain object constructed with the migration — `def initialize(migration)`,
`attr_reader :migration` — and has no `exec`. `DefaultStrategy`
(`.../migration/default_strategy.rb`) is a `method_missing` delegator:
unknown method calls on the strategy are forwarded to
`migration.connection.send(method, ...)`, with `respond_to_missing?` following.
That is how Rails' `Migration#method_missing` routes schema-statement calls
(`migration.rb`, `def method_missing(name, ...)` → `execution_strategy.send`).

trails instead invented `abstract exec(direction, migration, adapter)` and a
`DefaultStrategy#connection()` helper; the strategy is never consulted on the
execution path at all — `Migration#execMigration` calls `this.up()` /
`this.down()` directly. PR #5596 removed the last caller of `exec` (the
Migrator-level `strategy:` option), so `exec` is now dead surface kept only for
the class shape.

## Acceptance criteria

- [ ] `ExecutionStrategy` takes the migration in its constructor and exposes it
      the way Rails does; the invented `exec(direction, migration, adapter)`
      abstract method is gone.
- [ ] `DefaultStrategy` forwards unknown calls to `migration.connection`
      (the JS analogue of `method_missing` / `respond_to_missing?`), and
      `Migration`'s schema-statement dispatch goes through it.
- [ ] No caller passes a strategy to `Migrator` (that option was removed in
      #5596 and must not come back — Rails' Migrator has no strategy).
