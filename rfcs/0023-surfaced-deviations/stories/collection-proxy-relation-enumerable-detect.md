---
title: "collection-proxy-relation-enumerable-detect"
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

`Relation`/`CollectionProxy` `include Enumerable` in Rails, so `detect` (alias
`find`) returns the first record matching a block (e.g.
`authors.detect { |a| a.name == "David" }`). trails cannot express this: on a
Relation, `find` is the AR **finder** (find-by-id / primary key), so the
JS-idiom Array surface has **no** block-style "first matching record" method.
`detect` is the non-colliding name that fills this hole.

`detect` is heavily used in the Rails AR test suite (49 call sites) and, unlike
`collect`/`inject` (aliases for `map`/`reduce` that trails already has), it
covers behavior trails structurally cannot today.

- Rails: `Enumerable#detect`/`#find` (Ruby core), reachable via
  `ActiveRecord::Relation` / `Associations::CollectionProxy` `include Enumerable`.
- trails: `associations/collection-proxy.ts` (direct method surface),
  `packages/activerecord/src/relation/delegation.ts`. Note `find` on a Relation
  is the finder — do NOT overload it; add `detect`.

## Acceptance criteria

- [ ] Add `detect` to `CollectionProxy` (and `Relation` where applicable) reading
      the loaded records, mirroring `Enumerable#detect`: returns the first record
      for which the block is truthy, else `undefined`.
- [ ] Does NOT shadow or alter `Relation#find` (the AR finder) — `detect` is a
      distinct block-find over loaded records.
- [ ] Operates on the loaded records (JS has no blocking IO — load first),
      consistent with the existing curated Array delegation semantics.
- [ ] Driven by / restores a ported Rails test that exercises `detect` on a
      relation; test name matches Rails verbatim.
- [ ] api:compare and test:compare delta non-negative.
