---
title: "Decide the lifetime of stripThenable's hidden then"
status: claimed
updated: 2026-11-09
rfc: "0221-no-returned-proxies"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-09T03:50:32Z"
assignee: "actions-gem-and-benchmark-ips-dependency"
blocked-by: null
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
