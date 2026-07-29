---
title: "Drive the adapter prevent-writes suites through a pooled while_preventing_writes scope"
status: in-progress
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5620
claim: "2026-07-29T23:18:09Z"
assignee: "converge-adapter-prevent-writes-tests-onto-pooled-scope"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by CI on PR #5612 (story `preventing-writes-nil-connection-descriptor`,
RFC 0005), which added the `connection_descriptor.nil?` branch of
`preventing_writes?` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:227-232`).

Three ported prevent-writes suites drive the guard by assigning a FAKE POOL
object onto a standalone adapter instead of leasing a pooled connection inside
`Base.whilePreventingWrites`:

- `packages/activerecord/src/adapters/postgresql/postgresql-adapter-prevent-writes.test.ts:21-30`
  (`preventWrites`/`allowWrites` set `adapter.pool = { preventWrites: true }`)
- `packages/activerecord/src/adapters/mysql2/mysql2-adapter-perform-query.trails.test.ts:44-47`
- `packages/activerecord/src/adapters/postgresql/postgresql-adapter-perform-query.trails.test.ts`
  (same helper shape)

Rails' counterparts lease the ambient connection and wrap the assertion in
`ActiveRecord::Base.while_preventing_writes`
(`vendor/rails/activerecord/test/cases/adapters/postgresql/postgresql_adapter_prevent_writes_test.rb:13-25`),
so the flag is resolved through the pool's connection descriptor — the real
mechanism. The trails stub short-circuits on
`AbstractAdapter#isPreventingWrites`'s trails-invented `pool?.preventWrites`
branch, so the descriptor path these suites are supposed to cover is never
exercised.

Consequence observed on #5612: the nil-descriptor return had to be ordered
AFTER the `pool?.preventWrites` / `dbConfig.preventWrites` / `_config.preventWrites`
branches rather than in Rails' position (immediately after `replica?`), purely so
the fake pool keeps winning. Rails' branch order is therefore still not
reproduced, and the three invented config branches cannot be retired while the
stubs depend on them.

## Acceptance criteria

- The three suites lease a pooled connection (`Base.leaseConnection`) and drive
  prevention through `Base.whilePreventingWrites`, matching their Rails
  counterparts; the `preventWrites`/`allowWrites` fake-pool helpers are deleted.
- Do NOT rename or reword any test — the names match Rails and are how
  `test:compare` pairs them.
- With the stubs gone, move `isPreventingWrites`'s nil-descriptor return into
  Rails' position (immediately after the `replica?` branch) and assess whether
  the `pool?.preventWrites` / `pool?.dbConfig?.preventWrites` /
  `_config.preventWrites` branches have any remaining producer; retire the ones
  that do not.
- PG and MariaDB lanes green (these suites do not run on sqlite).
