---
title: "Retire isReplica's invented pool.dbConfig.replica and role=reading branches"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #5620 (story `converge-adapter-prevent-writes-tests-onto-pooled-scope`,
RFC 0005). That PR retired the three invented `preventWrites` short-circuits from
`AbstractAdapter#isPreventingWrites`; its sibling predicate `isReplica()` still
carries the same class of invention, and it is consulted first by
`isPreventingWrites` (`return true if replica?`), so it can mask the descriptor
path the same way the pool branches did.

Rails' `replica?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:199-201`)
is two lines:

```ruby
def replica?
  @config[:replica] || false
end
```

trails' `isReplica()`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1409-1415`)
has three branches:

```text
if (typeof (this.pool as any)?.dbConfig?.replica === "boolean") return pool.dbConfig.replica;
if (this.role === "reading") return true;
return this._config.replica === true;
```

Only the last mirrors Rails. The `pool?.dbConfig?.replica` short-circuit and the
`role === "reading"` promotion have no counterpart in `replica?` — Rails resolves
role-based prevention through the connected-to stack in
`Base.preventing_writes?` (`core.rb:207-214`), not by reclassifying the
connection as a replica. The `pool.dbConfig` branch is the same shape as the
`pool?.dbConfig?.preventWrites` branch #5620 retired for having no producer.

## Acceptance criteria

- Determine whether `pool?.dbConfig?.replica` and `role === "reading"` have any
  remaining producer, the way #5620 did for the `preventWrites` branches — check
  both the `dbConfig` writers and every suite that reaches `isReplica()` via a
  `reading` role.
- Retire the branches with no producer so `isReplica()` reduces to Rails'
  `_config.replica` read (`abstract_adapter.rb:199-201`). For any branch that
  does have a producer, record the producer and the Rails justification at the
  call site rather than in the PR body.
- Confirm the `role === "reading"` prevention paths still hold through the stack
  walk rather than through `isReplica()`:
  `connection-handling`, `database-selector`, `shard-keys`,
  `connection-swapping-nested`, `middleware/database-selector`, plus
  `adapter-prevent-writes` / `base-prevent-writes` on sqlite, PG and MariaDB.
- `abstract-adapter-preventing-writes.trails.test.ts`'s standalone-replica
  example (`{ database: ":memory:", replica: true }`) must keep passing — it
  covers the Rails-real `_config.replica` read.
