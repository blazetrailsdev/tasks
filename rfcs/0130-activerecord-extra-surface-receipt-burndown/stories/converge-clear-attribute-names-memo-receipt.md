---
title: "Converge clearAttributeNamesMemo's storyless CONVERGEABLE receipt into Rails' inline reload_schema_from_cache nil-out"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`clearAttributeNamesMemo` (`packages/activerecord/src/model-schema.ts:311`)
carries this receipt:

````text
@noRailsEquivalent CONVERGEABLE the recursive the recursive attribute-name and column-name memo nil-out of reload_schema_from_cache (model_schema.rb:553-568).
```text

Two things are wrong with it, both surfaced while deleting `Base.attribute` in
trails#7721:

1. **It names no story id.** `CONVERGEABLE <story-id>` is the tag's contract —
   the story IS the receipt and the tag only points at it. This one points at
   prose, so nothing tracks the convergence, and the prose is garbled
   ("the recursive the recursive").
2. **The two stories that would have been its target are already `done`** —
   `retire-attribute-names-memo-revision-stamp` (RFC 0115) and
   `column-names-memoization-unported` (RFC 0056). So the receipt outlived its
   burndown without anyone noticing.

Rails has no such helper. `reload_schema_from_cache`
(`activerecord/lib/active_record/model_schema.rb:553-568`) nils `@attribute_names`
and `@column_names` inline, recursing through `subclasses`, and
`attribute_names` itself reads `attribute_types.keys`
(`activemodel/lib/active_model/attributes.rb:74`) with no memo behind it.

## Converged shape

Either:

- inline the memo nil-out into `reloadSchemaFromCache` where Rails has it
  (`model-schema.ts:505`), walking `subclasses` the way Rails does, and delete
  `clearAttributeNamesMemo` along with its remaining call sites
  (`model-schema.ts:511,603`); or
- if the helper must survive as the JS spelling of that inline body, give its
  receipt a real `CONVERGEABLE <story-id>` pointing at this story and fix the
  duplicated prose.

The first is the actual convergence; the second is only acceptable if the
recursion genuinely cannot be written inline.

## Acceptance criteria

- No `@noRailsEquivalent` receipt in `model-schema.ts` carries a bare
  `CONVERGEABLE` with no story id or duplicated prose.
- `pnpm parity:api:extra --package activerecord` does not regress.
- The memo invalidation still happens on every path that reaches
  `reloadSchemaFromCache`, covered by a test that fails without it.
````
