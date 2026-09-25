---
title: "fix-scope-registry-stale-in-after-create-callback"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8070
claim: "2026-09-25T00:24:15Z"
assignee: "time-weekday-helpers-return-instant-not-time"
blocked-by: null
closed-reason: null
---

## Context

While converging `has_many_associations_test.rb`'s
`test_build_and_create_from_association_should_respect_passed_attributes_over_default_scope`
(vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:229-261)
for RFC 0132, found that `Bulb#record_count_after_create`
(packages/activerecord/src/test-helpers/models/bulb.ts:35-40, mirroring
vendor/rails/activerecord/test/models/bulb.rb:20-24's
`Bulb.unscoped { car&.bulbs&.count }`) returns 0 instead of the expected
cumulative count.

Repro: `Car.create(...)`, then `await car.bulbs.where({name:"exotic"}).create()`
twice. Each created bulb's `countAfterCreate` should be 1, then 2 (cumulative
unscoped count of the car's bulbs). It is 0 both times.

Isolated the cause: inside the `afterCreate` hook, even a plain
`association(car, "bulbs").toSql()` still bakes in the `name = 'defaulty'`
default-scope predicate, despite executing lexically inside
`Bulb.unscoped(async () => { ... })` (`packages/activerecord/src/scoping/default.ts:57`
-> `relation.scoping()` -> `_scoping()` in `packages/activerecord/src/relation.ts:1831`).
Calling the exact same `Bulb.unscoped(() => car.bulbs.toSql())` from OUTSIDE
the afterCreate callback (after the record's `.create()` promise has fully
settled) correctly drops the default scope. So `ScopeRegistry`'s
per-model `currentScope` (`packages/activerecord/src/scoping.ts`, backed by
`IsolatedExecutionState`) is not visible from inside a callback fired while a
`.create()`/`.createBang()` call on a scoped association proxy
(`car.bulbs.where(...)`) is still in flight, even though no code between the
`setCurrentScope` call and the read appears to open a new execution context.

The two related instances currently work around this by asserting the
observed (wrong) value of 0 rather than the Rails value:
`packages/activerecord/src/associations/has-many-associations.test.ts`, test
"build and create from association should respect passed attributes over
default scope".

## Acceptance criteria

- `Bulb#record_count_after_create` correctly reports the cumulative unscoped
  count of the owner's collection when called from inside an `afterCreate`
  callback fired during `association.create()`/`.createBang()` on a
  `.where(...)`-scoped collection proxy.
- The two `expect(bulb.countAfterCreate).toBe(0)` workarounds in
  `has-many-associations.test.ts` are updated to `toBe(1)` / `toBe(2)` and the
  explanatory comment is removed.
- No regression in `packages/activerecord/src/associations/collection-proxy.trails.test.ts`
  or the rest of `packages/activerecord/src/associations/`.
