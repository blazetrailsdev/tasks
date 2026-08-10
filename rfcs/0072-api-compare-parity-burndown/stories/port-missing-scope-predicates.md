---
title: "port null_scope?/already_in_scope?/intersect? + verify Dirty#as_json"
status: done
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: missing-methods
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5315
claim: "2026-07-25T19:34:52Z"
assignee: "port-missing-scope-predicates"
blocked-by: null
closed-reason: null
---

## Context

`output/api-comparison.json` (regenerated 2026-07-25) reports 4 missing
activerecord methods + 1 activemodel:

1. `null_scope?` → `isNullScope`,
   `vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1150`
   (`def null_scope?; @association.null_scope?; end`, used at :725/:729 for
   `calculate`/`pluck` routing). Target:
   `packages/activerecord/src/associations/collection-proxy.ts`.
2. `already_in_scope?` → `isAlreadyInScope`,
   `vendor/rails/activerecord/lib/active_record/relation.rb:1337`
   (`def already_in_scope?(registry)`, used at :545 in the scoping guard).
   Target: `packages/activerecord/src/relation.ts`.
3. `intersect?` → `isIntersect` ×2 —
   `vendor/rails/activerecord/lib/active_record/relation/delegation.rb:101`
   (Array-method delegate to `:records`; the comparison attributes it to both
   `relation.rb` and `relation/delegation.rb`). Follow how the sibling Array
   delegates (`split`, `rindex`, `in_groups`) are already ported in
   `packages/activerecord/src/relation/delegation.ts` and add `isIntersect`
   the same way.
4. activemodel `Dirty#as_json`,
   `vendor/rails/activemodel/lib/active_model/dirty.rb:264`
   (`def as_json(options = {})` — excludes mutation trackers from
   serialization). `packages/activemodel/src/dirty.ts:113-114` has a comment
   claiming the exclusion is inherent in trails' `asJson` path — verify that
   claim against the Rails test for dirty as_json (`pnpm rails:find as_json`);
   if inherent, this is a SKIP_GROUPS/exclude candidate with that reason, not
   a port.

For each: read the Rails source + tests first (`pnpm rails:find <name>`),
confirm genuinely unported, port into the Rails-layout file with method-order
compliance (the method-order manifest regenerates via `pnpm parity:api`).

## Acceptance criteria

- `isNullScope`, `isAlreadyInScope`, `isIntersect` ported to the files above,
  with the Rails-mirroring tests that exercise them (e.g. the null-scope
  calculate/pluck routing) ported or extended.
- `Dirty#as_json` either ported or excluded with the verified inherent-behavior
  reason.
- `pnpm parity:api` reports `missing: 0` for activerecord and activemodel;
  method-order lint stays green; no test renames.
