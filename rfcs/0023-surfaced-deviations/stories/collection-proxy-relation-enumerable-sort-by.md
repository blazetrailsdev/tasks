---
title: "collection-proxy-relation-enumerable-sort-by"
status: ready
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Relation`/`CollectionProxy` `include Enumerable` in Rails, so `sort_by` is
reachable on any relation (e.g. `posts.sort_by(&:created_at)`). trails does not
expose it: the curated Array delegation set
(`packages/activerecord/src/relation/delegation.ts`, PR #3653) maps only JS
`Array.prototype` methods, and `Array` has no `sortBy`. So a ported test that
calls `relation.sort_by { ... }` cannot be expressed faithfully.

`sort_by` is the single most-used Enumerable method in the Rails AR test suite
(124 call sites). It has no JS `Array` analogue and does **not** collide with any
AR query method, making it the highest-value Enumerable addition.

- Rails: `Enumerable#sort_by` (Ruby core), reachable via
  `ActiveRecord::Relation` / `Associations::CollectionProxy` `include Enumerable`
  (`activerecord/lib/active_record/relation.rb`,
  `associations/collection_proxy.rb`).
- trails: `packages/activerecord/src/relation/delegation.ts` (curated Array
  delegation), `associations/collection-proxy.ts` (direct method surface).

This is the established RFC 0023 pattern: a ported Rails test reaches an
Enumerable method trails lacks; converge that specific method rather than the
whole module (Enumerable is Ruby core, so it is invisible to api:compare —
test:compare is the driving signal).

## Acceptance criteria

- [ ] Add `sortBy` to `CollectionProxy` (and `Relation` where applicable) reading
      the loaded records, mirroring `Enumerable#sort_by` (stable, ascending by the
      block's return key; non-mutating like Ruby's `sort_by`, not `sort_by!`).
- [ ] Operates on a copy of the loaded records (JS has no blocking IO — load
      first), consistent with the existing curated Array delegation semantics.
- [ ] Does not shadow any AR query method.
- [ ] Driven by / restores a ported Rails test that exercises `sort_by` on a
      relation; test name matches Rails verbatim.
- [ ] api:compare and test:compare delta non-negative.
