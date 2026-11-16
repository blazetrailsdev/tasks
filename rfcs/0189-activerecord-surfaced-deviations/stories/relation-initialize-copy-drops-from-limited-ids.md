---
title: "Relation#initialize_copy is Rails' two lines (no _fromLimitedIds copy)"
status: draft
updated: 2026-11-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
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

`ActiveRecord::Relation#initialize_copy` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:97-100`) is `@values = @values.dup; reset`. `packages/activerecord/lib/relation.ts` `initializeCopy` also copies `_fromLimitedIds` across and returns `this`. trails#10192 tried removing the copy, and that broke `relation/eager-load-under-cte-and-from.trails.test.ts` > "filters an eager-loaded limited FROM relation by its materialized ids when it runs". The reason: `count` / `spawn` clone the relation after `_materializeDeferredDistinctPkPredicates` (`relation.ts:1088-1091`) has filled the memo, and `buildFrom` (`relation/query-methods.ts:1871`) reads it.

## Acceptance criteria

- [ ] The materialized FROM ids are not kept as a relation ivar. Either the clone re-drains them, or `buildFrom` gets them some other way, so that `initializeCopy` is Rails' two lines.
- [ ] The eager-load-under-CTE test passes on all three adapters.
