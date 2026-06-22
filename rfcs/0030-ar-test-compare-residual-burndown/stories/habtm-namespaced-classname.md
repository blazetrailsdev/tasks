---
title: "habtm: namespaced/symbol className resolution"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 100
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030 test:compare residual burndown, split out of `a4-habtm-join-aliasing`.
Four HABTM tests in
`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`
need className resolution work the aliasing fix did not cover:

- `has and belongs to many in a namespaced model pointing to a namespaced model` (~1208)
- `has and belongs to many in a namespaced model pointing to a non namespaced model` (~1214)
- `habtm with reflection using class name and fixtures` (~1248)
- `with symbol class name` (~1254)

ROOT-CAUSE (from skip tags): className resolution for namespaced models
(e.g. "MyModule::Project") and cross-namespace (namespaced owner → top-level target)
not handled in habtm lookup; the reflection/fixtures variants depend on the same
resolution path. Fix in `associations/builder/has-and-belongs-to-many.ts` className
resolution (and the join-model registry key).

## Acceptance criteria

- [ ] All four tests un-skipped and green against canonical SQLite (and PG/MySQL per gate).
- [ ] No new gate-mismatches for this file.
