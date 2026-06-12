---
title: "Serialization include through the reader"
status: done
updated: 2026-06-12
rfc: "0022-singular-association-holder"
cluster: associations
deps: ["b1-singular-association-holder"]
deps-rfc: []
est-loc: 200
priority: 2
pr: 3138
claim: "2026-06-11T23:36:57Z"
assignee: "b2-serialization-via-reader"
blocked-by: null
---

## Context

`activemodel/src/serialization.ts:236` reads `record._cachedAssociations?.get(name)`
for any `include` key — a generic "include bag" with no Rails counterpart. Rails'
`serializable_add_includes` calls `send(association)` (the real reader). Some
`json-serialization.test.ts` cases exploit the bag by seeding
`_cachedAssociations["comments"]` on models that declare no `has_many comments`,
which Rails could not run. This overload blocks deleting `_cachedAssociations`
(b4) and must be resolved by moving serialization onto the reader.

## Acceptance criteria

- [ ] `activemodel` serialization reads a synchronous loaded-target accessor
      (host-interface method, e.g. `_loadedAssociationTarget(name)`) instead of
      poking `_cachedAssociations` / `_preloadedAssociations` directly. activerecord
      supplies the method; activemodel depends only on the interface.
- [ ] The accessor returns the holder (b1) / `CollectionProxy` target when the
      association is loaded, and a skip signal otherwise — mirroring Rails'
      `if records = send(association)`.
- [ ] `json-serialization.test.ts` cases that seeded `_cachedAssociations` for
      undeclared associations are re-pointed at declared associations + the holder /
      proxy. No test renames; behavior asserted by each test preserved.
- [ ] `serialization.test.ts` + `json-serialization.test.ts` pass.
- [ ] `api:compare` delta non-negative on activemodel `serialization.rb` /
      `serializers/json.rb`.

## Notes

Keep it synchronous — serialization is sync. The accessor must not trigger a DB
load; an unloaded association serializes as absent, exactly as Rails skips on a
nil `send`. Rails source: `activemodel/lib/active_model/serialization.rb`
(`serializable_add_includes`), `activerecord/lib/active_record/serialization.rb`.
