---
title: "activerecord: adapter log and MySQL columns_for_distinct lose their invented nil defaults"
status: in-progress
updated: 2026-10-06
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8570
claim: "2026-10-06T12:29:47Z"
assignee: "port-base-flash-and-log-subscriber-skips"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8490. Two small residues in bodies that PR converged:

- `packages/activerecord/src/connection-adapters/abstract-adapter.ts#log` passes
  `transaction: presence(this.currentTransaction().userTransaction) ?? null`. Rails passes
  `transaction: current_transaction.user_transaction.presence`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1134-1149`),
  with no `||`. The `?? null` exists because activesupport's `presence` answers `undefined` for a
  blank value where Ruby answers `nil`, and `query-cache.test.ts` ("payload without open
  transaction") asserts `toBeNull()` on the cached path's payload.
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts#columnsForDistinct`
  declares `orders?` and reads `orders ?? []`, and tests `typeof s === "string"`. Rails'
  signature is `columns_for_distinct(columns, orders)` with `orders` required, and the block is
  `s = visitor.compile(s) unless s.is_a?(String)`
  (`connection_adapters/abstract_mysql_adapter.rb:619-628`). The optional parameter comes from the
  base `SchemaStatements#columnsForDistinct(columns, _orders?)`, where Rails' is also required
  (`connection_adapters/abstract/schema_statements.rb:1433-1435`).

## Acceptance criteria

- [ ] `log` passes `presence(...)` with no `??`; the nil-vs-undefined answer is settled where `presence` is defined, and the payload tests agree with it.
- [ ] `columnsForDistinct` takes a required `orders` in both the base and the MySQL override, with no `?? []`.
- [ ] The short-circuit projection of `pnpm parity:api:arms:report --package=activerecord` shows no `+or` for either method.
