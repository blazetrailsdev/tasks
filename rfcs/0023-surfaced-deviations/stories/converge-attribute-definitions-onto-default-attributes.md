---
title: "Converge _attributeDefinitions onto Rails' _default_attributes (drops STI overlay machinery)"
status: ready
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
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
Rails-shaped pending chain, STI needed bespoke machinery added in PR #4981
(`packages/activerecord/src/model-schema.ts`):

- `rebuildStiSubclassOverlay` — rebuilds a subclass's map as an overlay over the
  base's, re-applying precedence rules Rails never needs.
- `_schemaRevision` / `_stiOverlaySyncedAt` — a hand-rolled invalidation counter,
  because `resetColumnInformation` mutates the base map IN PLACE (so map identity
  is stable) and reflection can change a column's type/default with an identical
  key set (so key coverage is also blind). Rails instead invalidates the class and
  its descendants directly (`model_schema.rb:523`, `:553`).
- `syncStiSubclassAttributeDefinitions` called from BOTH `loadSchema` early-return
  paths, because `_schemaLoaded` and `_schemaLoadPromise` both live on the STI base.
- `replayOwnPendingDecorators` — a second decorator-replay path parallel to
  `PendingDecorator#applyTo`, which already drifted once (it bypassed the
  replay-depth context; fixed in the same PR).

Every one of these exists only to keep the invented map coherent. Three of the four
were the subject of review findings on #4981, which is a strong signal the map is
carrying complexity Rails does not have.

## Acceptance criteria

- [ ] Readers of `_attributeDefinitions` resolve through `_default_attributes` /
      `attribute_types` (the Rails-shaped, per-class, replay-driven surface) instead.
- [ ] `rebuildStiSubclassOverlay`, `syncStiSubclassAttributeDefinitions`,
      `_schemaRevision`, and `_stiOverlaySyncedAt` are deleted.
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
