---
title: "insert_all resolveSti ignores registerSubclass STI"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 80
priority: 29
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in d2-insert-all-on-duplicate (PR #3442). `InsertAll#resolveSti`
(packages/activerecord/src/insert-all.ts) gates on
`isDescendsFromActiveRecord(model)` and does not inject the STI inheritance
column for the canonical `SpecialCategory` (STI declared via `registerSubclass`
in test-helpers/models/category.ts, not `enableSti`). As a result
`SpecialCategory.insert_all([{name:"First"},{name:"Second",type:null}])` leaves
the first row without a `type`, so the rows have mismatched keys and
`verifyAttributes` throws "All objects being inserted must have the same keys".

Blocks `insert all and upsert all with sti` in
packages/activerecord/src/insert-all.test.ts (currently `it.skip`), mirroring
Rails insert_all_test.rb:330.

## Acceptance criteria

- [ ] `resolveSti` recognizes `registerSubclass`-based STI subclasses and
      injects the inheritance column on rows that omit it.
- [ ] Un-skip `insert all and upsert all with sti`; passes on SQLite.
