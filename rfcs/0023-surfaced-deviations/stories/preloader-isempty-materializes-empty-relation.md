---
title: "Preloader.isEmpty materializes an empty Relation to match Rails empty?"
status: ready
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Preloader.isEmpty()` (packages/activerecord/src/associations/preloader.ts) diverges from Rails `empty?` (vendor/rails/activerecord/lib/active_record/associations/preloader.rb:115-117) for a not-yet-materialized **empty** Relation.

Rails: `empty?` is `associations.nil? || records.length == 0`. For a Relation, `records.length` materializes it synchronously, so an empty relation returns `true`.

Trails: `isEmpty()` cannot run a query synchronously (async I/O), so any not-yet-materialized Relation is reported non-empty and the materializing query is deferred to `call()`. The observable query count is unchanged (Rails materializes in `empty?` then `Batch` rejects the empty preloader = 1 query; trails materializes in `call()` and the 0-record branch issues no preload = 1 query). The deviation is only the boolean a standalone `isEmpty()` caller sees on an empty relation.

Introduced in PR #3838. Low risk today: the only relation-accepting caller (the `assert_queries_count(2)` test) always calls `call()`.

## Acceptance criteria

- A caller invoking the preloader's emptiness check on an empty Relation gets the same answer as Rails (`true`), materializing the relation as Rails does.
- Query count for the existing relation test stays at 2.
- Resolve the TS sync/async mismatch without regressing the array path or the root-branch guard (branch.ts:48).
- test:compare delta non-negative.
