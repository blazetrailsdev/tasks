---
title: "Decide the lifetime of stripThenable's hidden then"
status: blocked
updated: 2026-11-09
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-09T12:20:24Z"
assignee: "generators-actions-indentation-helpers"
blocked-by: "Tried on trails generators-actions-indentation-helpers bundle: a one-microtask own then:undefined (queueMicrotask delete) passes all of relation.test.ts incl. loaded all/reload, but fails 90 batches/has-many tests: batches.ts:464,549 pass stripThenable(rel) into a block that holds it across awaits, and an async-generator yield re-awaits it. Needs those block/yield sites converged off stripThenable first (a story per site), then the microtask lifetime lands."
closed-reason: null
---

## Context

Tried on trails#9816 and reverted: `stripThenable` (packages/activerecord/src/relation) cannot drop its Proxy until the lifetime of the hidden `then` is decided. Rails has no thenable (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`, `load` / `records`); the hide exists only so `await rel` resolves to the loaded relation.

Three lifetimes were tried, each red:

- hide `then` for one read: every promise-resolution layer re-reads `then`, so it reappears and recurses;
- hide until the macrotask ends: `await rel` twice in one tick sees no `then` the second time (RelationTest "loaded all", "reload");
- hide permanently: an awaited relation never loads again (batches, concat tests).

## Acceptance criteria

- Decide and document the lifetime (e.g. a resolution-scoped own `then: undefined` restored after the resolve job), with a test per failing case above.
- Then `strip-thenable-without-a-returned-proxy` can land with no returned Proxy.
