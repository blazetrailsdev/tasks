---
title: "converge-owner-fk-to-reflection-foreign-key"
status: ready
updated: 2026-06-17
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

Surfaced while fixing `sti-hasmany-writepath-foreign-key-declaring-class`
(PR #3541) and its read-path sibling `b2-sti-hasmany-preload-foreign-key`
(PR #3421).

Trails derives a hasMany/through owner foreign key from the **owner instance's**
class via `underscore(ctor.name)_id`. Rails has no such path: it always uses
`reflection.foreign_key`, computed once from `reflection.active_record`
(the class that _declared_ the association) at reflection-build time
(`active_record/reflection.rb` `derive_foreign_key`;
`active_record/associations/foreign_association.rb` `set_owner_attributes`
uses `reflection.join_foreign_key`, `nullified_owner_attributes` uses
`Array(reflection.foreign_key)`). For an STI subclass owner — a `SpecialPost`
row whose `has_many :special_comments` is declared on `Post` — the trails
derivation produces `special_post_id` instead of `post_id`.

This is the root cause of two separate latent STI bugs already fixed
piecemeal. PR #3421 converged the read/scope path (`computeHasManyWhere`);
PR #3541 converged the four write paths (`_buildRaw`, `setOwnerAttributes` via
`foreignKeyColumns`, `push`, `_buildNullifyUpdates`) — but both keep
`underscore(ctor.name)_id` as a _fallback_ rather than removing it, and many
sibling sites were not touched.

Remaining `underscore(ctor.name)`-based owner-FK derivations (as of 2026-06-17,
verify line numbers before editing):

- `associations.ts:1254`, `:1352`, `:1479`, `:1638`, `:2161`, `:2270`,
  `:2642` (counter-cache column), `:2860`
- `associations/collection-proxy.ts:815`, `:1603`, `:1692`, `:2055`, `:2191`
- `associations/collection-association.ts:639`, `:641`
- `associations/has-many-association.ts:361`

Several (e.g. `associations.ts:1352`, `:2860`, and the through-FK derivations
at `:2161`/`:2270`) are not guarded by a `_reflectOnAssociation` lookup at all,
so they take the owner-class derivation unconditionally.

## Acceptance criteria

- [ ] Audit each remaining site above: determine whether the `ctor.name`
      fallback is reachable for a _registered_ association (it should be dead
      whenever `_reflectOnAssociation(name)` returns a rich reflection).
- [ ] Route every owner-FK derivation through the rich reflection's
      `foreignKey` (resolve via `ctor._reflectOnAssociation?.(name)?.foreignKey`,
      the pattern established in `foreignKeyPresent` / `foreignKeyColumns`),
      including the through-association owner-FK derivations.
- [ ] Where the `underscore(ctor.name)_id` fallback is provably dead, remove it;
      where it is load-bearing, fix the underlying reflection-registration gap so
      it can be removed (do not ratify it).
- [ ] Add STI-owner coverage for any path not already exercised by #3421/#3541
      (notably through associations and the counter-cache column derivation).
- [ ] No behavior change for the non-STI registered-reflection case
      (reflection.foreignKey == prior derivation there).

Likely larger than one 500-LOC PR; split into non-overlapping file groups off
`main` (e.g. `associations.ts` vs the `associations/*` modules) and register
each split as its own story rather than fanning out PRs.
