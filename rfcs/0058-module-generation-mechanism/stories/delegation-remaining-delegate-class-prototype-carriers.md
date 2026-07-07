---
title: "delegation-remaining-delegate-class-prototype-carriers"
status: ready
updated: 2026-07-07
rfc: "0058-module-generation-mechanism"
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

Follow-up to `delegation-generated-methods-per-model-prototype-carrier` (which
landed the **Relation** carrier). That PR converged the primary delegate class:
generated relation methods now resolve as real methods via a per-model
`Relation` subclass prototype carrier (`relationClassFor` in
`packages/activerecord/src/relation/delegation.ts`), fed by
`GeneratedRelationMethods#generate` → `includeInto`, and base relation
construction (`Base._buildDefaultRelation` / `_buildBareRelation` /
`_buildUnscopedRelation`) plus `Relation#_newRelation` route through it. The
`_generatedMethodsByModel` hot-path side-table and the explicit lookup branches
in `delegation.ts` / `associations.ts` were removed.

The remaining three delegate classes still construct **shared** (non-per-model)
instances, so for `AssociationRelation` / `DisableJoinsAssociationRelation`
targets the generated-method resolution falls back to the `Proxy` miss path's
`classMethodDelegator` each call (correct behavior, unconverged mechanism —
`generate` installs onto the Relation carrier, which is not in their prototype
chain). Construction sites to reroute:

- `association-relation.ts:55,337` (`new AssociationRelation`)
- `disable-joins-association-relation.ts:292,472,478` and
  `disable-joins-association-scope.ts:333` (`new DisableJoinsAssociationRelation`)
- `associations/collection-proxy.ts` (CollectionProxy construction /
  `_wrapAsAssociationRelation`)

## Acceptance criteria

- [ ] Add per-model subclass carriers for `AssociationRelation`,
      `DisableJoinsAssociationRelation`, and `CollectionProxy` (one `generate`
      feeds all carriers via `GeneratedRelationMethods#includeInto`), and route
      their construction sites through them so generated methods resolve as real
      methods on those instances too.
- [ ] `uncacheableMethods` gate stays load-bearing across all four carriers
      (a generated `target` must never shadow `CollectionProxy#target`);
      `DelegationCachingTest` still holds.
- [ ] No observable behavior change; `api:compare` / `test:compare` deltas
      non-negative. Bench: no relation/proxy construction regression.
