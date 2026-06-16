---
title: "Wire inverse_of before callbacks on preloader + join-dependency eager paths"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3503 (inverse-of-single-association-access-convergence). That PR
threaded a per-record instantiation block through `_instantiate` /
`_loadFromSql` / `Relation#_instrumentInstantiation` so `inverse_of` is wired
BEFORE the child's find/initialize callbacks fire (Rails' `init_with_attributes`
yield). Only the **direct collection load path** (`loadHasMany`, which sets
`Relation#_instantiateBlock`) uses it.

The **preloader** (`includes`/`preload`) still wires the inverse AFTER
instantiation in `preloader/association.ts` `loadRecords` → `setInverse` loop
(`packages/activerecord/src/associations/preloader/association.ts:158-168`), and
the **join-dependency eager path** wires it after `construct`
(`packages/activerecord/src/associations/join-dependency.ts:1209`). In Rails the
preloader passes `set_inverse_instance` as the `find_by_sql` block
(`Preloader::Association#records_for`), so an `after_find` on a preloaded child
already sees the inverse. The Rails test
`test_inverse_instance_should_be_set_before_find_callbacks_are_run` exercises all
three paths (`Human.first.interests.reload`,
`Human.includes(:interests).first`, `Human.joins(:interests).includes(...)`);
PR #3503's TS test only covers the direct `reload` path.

The batch preloader (`LoaderRecords` shares one query across loaders) complicates
this — the block needs per-loader owner lookup, so threading it requires either a
per-record owner resolver in the shared query block or per-loader re-instantiation.

## Acceptance criteria

- [ ] Preloaded children (`includes`/`preload`) have their `inverse_of` wired
      before find/initialize callbacks (thread the block through
      `LoaderQuery#loadRecordsForKeys` / `Relation#_instantiateBlock`).
- [ ] Join-dependency eager-loaded children likewise wire inverse before callbacks.
- [ ] Extend the TS `inverse instance should be set before find/initialize
callbacks are run` tests to cover the `includes` and `joins+includes`
      scenarios from Rails (currently only the direct `reload` path is tested).
