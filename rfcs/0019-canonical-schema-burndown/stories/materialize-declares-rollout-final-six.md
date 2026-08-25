---
title: "Materialize declares: remaining 6 models behind generator gaps A-D"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 86
pr: 4222
claim: "2026-06-27T18:26:33Z"
assignee: "materialize-declares-rollout-final-six"
blocked-by: null
---

## Context

PR #4193 (`materialize-declares-rollout-remaining`) materialized 21 of the 28
models PR #3545 skipped. **6 remain un-materialized** behind distinct generator
gaps (the 7th, `user-with-invalid-relation`, is a permanent intentional skip —
references non-AR classes and cannot typecheck; do NOT materialize it).

Each gap is in the materialize/virtualizer toolchain
(`packages/activerecord/scripts/materialize-model-declares.ts`,
`packages/activerecord/src/type-virtualization/{resolve-target,synthesize}.ts`):

- **Gap A — `::`-namespaced className** (`company.ts`, `company-in-module.ts`):
  `NamespacedFirm.hasMany("clients", { className: "Namespaced::Client" })`
  emits `AssociationProxy<Namespaced::Client>` — invalid TS. The resolver must
  demodulize/resolve the Ruby-style `Namespaced::Client` to the in-file TS class
  (and auto-import it).
- **Gap B — assoc-name singularization mis-resolves target** (`eye.ts`):
  `hasOne("iris")` synthesizes `declare iris: Iri | null` (classify of `"iris"`
  → `Iri`) instead of the registered `Iris` model. Needs registry-aware
  singular resolution, not bare `classify`.
- **Gap C — intentionally-broken Rails subclass widens an inherited assoc**
  (`cpk.ts`, `pirate.ts`): `CpkBrokenOrderWithNonCpkBooks.books`
  (`AssociationProxy<CpkNonCpkBook>` vs parent `AssociationProxy<CpkBook>`) and
  `pirate`'s `catchphrase` (collides with a `dirty.test.ts` accessor override)
  are deliberately incompatible Rails fixtures; baking a narrowed declare is a
  TS2416 conflict. Needs the synthesizer to detect and suppress the
  genuinely-conflicting override (related to
  `materialize-declares-cross-file-subtype-suppression`).
- **Gap D — composed_of aggregation column** (`customer.ts`): baked
  `declare balance: number` conflicts with the `Money` aggregation in
  `aggregations.test.ts` (`number & Money`). The generator must skip/adjust the
  attribute declare for composed_of columns.

## Acceptance criteria

- [ ] Generator emits typecheck-green declares for `company`, `company-in-module`
      (Gap A), `eye` (Gap B), `cpk`, `pirate` (Gap C), `customer` (Gap D), or the
      model is re-confirmed as a documented permanent skip with a specific reason.
- [ ] Each newly-materialized model + the whole repo typecheck green
      (`node scripts/typecheck.mjs`); no hand-edits to generated declares.
- [ ] `user-with-invalid-relation` stays a documented permanent skip.
- [ ] Test names match Rails verbatim.
