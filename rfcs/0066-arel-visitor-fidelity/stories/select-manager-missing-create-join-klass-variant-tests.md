---
title: "Port select_manager_test.rb's three 'create join nodes with a … klass' tests"
status: done
updated: 2026-07-23
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 57
pr: 5102
claim: "2026-07-23T00:33:29Z"
assignee: "select-manager-missing-create-join-klass-variant-tests"
blocked-by: null
closed-reason: null
---

## Context

`select_manager_test.rb:509-531` has three tests trails never ported:

- `should create join nodes with a full outer join klass` (rb:509)
- `should create join nodes with an outer join klass` (rb:517)
- `should create join nodes with a right outer join klass` (rb:525)

Each is `relation.create_join "foo", "bar", Arel::Nodes::<Klass>` +
`assert_kind_of` + `left == "foo"` / `right == "bar"`. test:compare shows
select-manager.test.ts at 111/113 with 2 Miss (PR #5056's audit; the
matcher collapses the three Rails names to 2 missing entries).

trails' `SelectManager` gets `createJoin` from the FactoryMethods mixin
(`packages/arel/src/factory-methods.ts:65`, converged by #5053/#5056; params
already admit strings), and `table.test.ts:24-43` shows the exact TS body
shape for the `Table#createJoin` klass variants — mirror those three tests
into `select-manager.test.ts` next to `should create join nodes`
(select-manager.test.ts:~485).

## Acceptance criteria

- Three new tests in `packages/arel/src/select-manager.test.ts` named
  verbatim after `select_manager_test.rb:509,517,525`, asserting
  instanceOf + `left`/`right` like Rails.
- test:compare select-manager.test.ts reaches 113/113.
