---
title: "collection-proxy-relation-enumerable-partition"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3659
claim: "2026-06-19T17:00:27Z"
assignee: "collection-proxy-relation-enumerable-partition"
blocked-by: null
---

## Context

`Relation`/`CollectionProxy` `include Enumerable` in Rails, so `partition`
splits records into two arrays — matched and unmatched — in a single pass (e.g.
`posts.partition(&:published?)`). trails has no equivalent: `Array` has no
`partition`, and the curated Array delegation set
(`packages/activerecord/src/relation/delegation.ts`, PR #3653) maps only JS
`Array.prototype` methods.

Lower frequency than `sortBy`/`detect` (4 call sites in the Rails AR test suite)
but a genuine gap: no JS `Array` analogue and no AR query-method collision.

- Rails: `Enumerable#partition` (Ruby core), reachable via
  `ActiveRecord::Relation` / `Associations::CollectionProxy` `include Enumerable`.
- trails: `associations/collection-proxy.ts` (direct method surface),
  `packages/activerecord/src/relation/delegation.ts`.

## Acceptance criteria

- [ ] Add `partition` to `CollectionProxy` (and `Relation` where applicable)
      reading the loaded records, mirroring `Enumerable#partition`: returns
      `[matched, unmatched]` preserving order.
- [ ] Does not shadow any AR query method.
- [ ] Operates on the loaded records (JS has no blocking IO — load first),
      consistent with the existing curated Array delegation semantics.
- [ ] Driven by / restores a ported Rails test that exercises `partition` on a
      relation; test name matches Rails verbatim.
- [ ] api:compare and test:compare delta non-negative.
