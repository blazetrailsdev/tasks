---
title: "relation-none-predicate-misses-empty-fallback"
status: ready
updated: 2026-07-22
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification (story
verify-value-accessor-read-wide-entries-per-entry). Rails `Relation#none?`
(vendor/rails/activerecord/lib/active_record/relation.rb:378-383) returns true
for `@none`, defers to super when args/block given, and otherwise falls through
to `empty?` — i.e. it answers "is the result set empty" with a query. Trails
`Relation#isNone` (packages/activerecord/src/relation.ts:6227-6229) reads only
the `_isNone` flag set by `none()`/`noneBang`
(relation/query-methods.ts:1398-1404), so `Post.where(...).isNone()` is false
even when the relation matches no rows.

## Acceptance criteria

- `isNone()` (or an async counterpart matching trails' async-terminal
  conventions) falls through to the `empty?` check as Rails does.
- Rails' relation tests covering `none?` pass unmodified names.
