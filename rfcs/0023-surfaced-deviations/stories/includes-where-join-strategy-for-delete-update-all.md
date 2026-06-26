---
title: "deleteAll/updateAll: switch to JOIN strategy when includes references WHERE table"
status: ready
updated: 2026-06-26
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `Relation#delete_all` and `Relation#update_all` auto-detect when the `where` clause references a table that appears in `includes`, and switch to a `LEFT OUTER JOIN` strategy (via `apply_join_dependency`) instead of a separate preload SELECT.

Trails `includes` always uses a separate SELECT (preload strategy). As a result, `where({ toys: { name: "Bone" } })` after `includes("toys")` fails with "no such column: toys.name" because the toys table is not part of the FROM/JOIN when the DELETE/UPDATE is executed.

Skipped tests:

- `packages/activerecord/src/relation/delete-all.test.ts` — "delete all with includes" (`it.skip`)
- `packages/activerecord/src/relation/update-all.test.ts` — "update all with includes" (`it.skip`)

Rails source: `activerecord/lib/active_record/relation.rb` — `update_all` and `delete_all` both call `eager_loading?` / `apply_join_dependency` when the relation is eager-loading. `eager_loading?` (relation.rb:1474-1488) returns true when `includes` + `references` overlap (hash-form `where` auto-populates `references_values`).

## Acceptance criteria

- Both skipped includes tests pass without `it.skip`.
- `Pet.includes("toys").where({ toys: { name: "Bone" } }).deleteAll()` and `.updateAll(...)` execute correctly via JOIN strategy.
- No regression in existing includes/preload tests.
