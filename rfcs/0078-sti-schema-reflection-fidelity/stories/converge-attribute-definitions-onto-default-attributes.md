---
title: "Converge _attributeDefinitions onto Rails' _default_attributes (drops STI overlay machinery)"
status: done
updated: 2026-08-20
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6769
claim: "2026-08-20T11:22:33Z"
assignee: "port-activejob-test-helper-for-destroy-association-async"
blocked-by: null
closed-reason: null
---

## Context

`_attributeDefinitions` is a trails invention with no Rails counterpart. Rails
has `_default_attributes` (memoized per class, seeded from `columns_hash`, then
replaying that class's own pending modifications) and `attribute_types` derived
from it — see `vendor/rails/activemodel/lib/active_model/attribute_registration.rb`
and `vendor/rails/activerecord/lib/active_record/model_schema.rb`.

Because trails carries a second, eagerly-maintained definitions map alongside the
Rails-shaped pending chain, it still needs bespoke machinery in
`packages/activerecord/src/model-schema.ts`:

- `_schemaRevision` (`:78-82`, `:279-283`, `:913`, `:1202`) — a hand-rolled global
  epoch counter, because `resetColumnInformation` mutates the map IN PLACE (so map
  identity is stable) and reflection can change a column's type/default with an
  identical key set (so key coverage is also blind). Rails instead invalidates the
  class and its descendants directly (`model_schema.rb:523`, `:553`). It is now the
  input to `schemaStaleAgainstAncestors` / `ownSchemaMemo` (`:74-104`) — see
  [[sti-schema-stale-invariant-unenforced]].
- `replayOwnPendingDecorators` (called from `model-schema.ts:1193`) — a second
  decorator-replay path parallel to `PendingDecorator#applyTo`, guarded by its own
  `replayingDecorators` WeakSet (`:1049`).
- `scrubSchemaSourcedDefinitions` (`:894`) — hand-partitions the map by
  `source === "schema"` on every reload, work Rails' per-class replay does for free.

Both exist only to keep the invented map coherent.

Re-verified against `origin/main` 2026-08-09. The three STI-overlay artefacts
this story originally named — `rebuildStiSubclassOverlay`,
`syncStiSubclassAttributeDefinitions` and `_stiOverlaySyncedAt` — are all gone from
`packages/` (see the closed [[reload-schema-from-cache-sti-apparatus-absent-in-rails]]
and [[sti-subclass-attribute-routes-to-sti-base]]). `_attributeDefinitions` itself is
still a live invention with readers across `attribute-methods.ts`,
`join-dependency.ts`, `inheritance.ts` and `model-schema.ts`, so the headline
convergence remains — but it is now a smaller job than the 400 LOC estimate implies.

## Acceptance criteria

- [ ] Readers of `_attributeDefinitions` resolve through `_default_attributes` /
      `attribute_types` (the Rails-shaped, per-class, replay-driven surface) instead.
- [ ] `_schemaRevision` (and with it `schemaStaleAgainstAncestors` /
      `ownSchemaMemo`) and `scrubSchemaSourcedDefinitions` are deleted.
- [ ] `replayOwnPendingDecorators` is deleted, leaving `PendingDecorator#applyTo`
      as the single replay path.
- [ ] The STI guards added in `normalized-attribute.trails.test.ts` still pass
      (subclass decoration does not leak to base/siblings and survives reload).
- [ ] No regression in `inheritance`, `attributes`, `model-schema`, `enum`,
      `dirty`, `sti/`, and the `encryption/` suite.

## Notes

Large and load-bearing — likely needs splitting once the reader inventory is known.
Start by grepping `_attributeDefinitions` readers and classifying each as
"could read attribute_types" vs "genuinely needs schema metadata".
