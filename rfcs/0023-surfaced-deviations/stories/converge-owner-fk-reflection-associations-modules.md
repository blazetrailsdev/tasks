---
title: "converge-owner-fk-reflection-associations-modules"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3698
claim: "2026-06-20T02:54:43Z"
assignee: "converge-owner-fk-reflection-associations-modules"
blocked-by: null
---

## Context

Split sibling of `converge-owner-fk-to-reflection-foreign-key` (PR forthcoming),
which converged the `associations.ts` singular/through owner-FK derivations
(`loadHasOne`, `buildHasOne`, `loadHasMany`, `buildThroughAssociation`,
`setHasOne`) to route through the rich reflection's `foreignKey` via the new
`ownerReflectionForeignKey(ctor, name)` helper (mirrors Rails
`reflection.foreign_key` — uses the _declaring_ class, not the STI subclass
owner instance). That PR was scoped to `associations.ts` only (non-overlapping
file group, per the parent story's split guidance).

Remaining `underscore(ctor.name)`-based owner-FK derivations to converge live in
the `associations/*` modules and a few residual `associations.ts` sites (verify
line numbers before editing):

- `associations/collection-proxy.ts` — sites still deriving from `ctor.name`
  for the has_many CPK branch (e.g. `_buildRaw`/nullify CPK fallbacks around
  the `_reflectionForeignKey()` calls).
- `associations/collection-association.ts` `foreignKeyColumns()` CPK fallback
  (`underscore(ctor.name)_${col}`) — confirm dead vs load-bearing.
- `associations/has-many-association.ts` FK fallback.
- `associations/has-many-through-association.ts` owner/source FK derivations
  (`:388` ownerFk, `:265` source fk).
- `associations.ts` residual: HABTM owner FK (`singleFk(... underscore(ctor.name)_id)`),
  `createThroughAssociation` source `targetFk` (`underscore(throughCtor.name)_id`),
  `destroyedByAssociationForeignKey` (`underscore(destroyed.constructor.name)_id`).

## Acceptance criteria

- [ ] Route every remaining owner-FK derivation in the `associations/*` modules
      and the residual `associations.ts` sites above through
      `ctor._reflectOnAssociation?.(name)?.foreignKey` (reuse the
      `ownerReflectionForeignKey` pattern), keeping `underscore(ctor.name)_id`
      only as the unregistered-anonymous-association fallback.
- [ ] Add STI-owner coverage for the has*many :through \_write* path
      (`collection-proxy` build/create through an STI subclass owner resolves the
      declaring-class through FK, e.g. `post_id` not `special_post_id`), which the
      parent PR could not exercise (no canonical STI has_one:through fixture).
- [ ] No behavior change for the non-STI registered-reflection case.

Non-overlapping with the parent PR (different files). 500-LOC ceiling; single PR
from main.
