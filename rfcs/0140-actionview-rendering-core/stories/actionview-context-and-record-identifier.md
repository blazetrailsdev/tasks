---
title: "Port ActionView::Context, RecordIdentifier and ModelNaming"
status: claimed
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 200
priority: 21
pr: null
claim: "2026-09-09T01:49:11Z"
assignee: "template-text-html-and-raw-file-classes"
blocked-by: null
closed-reason: null
---

## Context

Three absent files, 13 methods, that sit under the rendering core rather than
under helpers:

- `context.rb` (6) — the `ActionView::Context` module: `_layout_for`, the
  `view_flow` accessor and the `_prepare_context` that seeds it. `Base` includes
  it, and `base.rb`'s 4 missing methods are partly this seam.
- `record_identifier.rb` (5) — `dom_id`, `dom_class`, `record_key_for_dom_id`,
  and the `JOIN` / `NEW` constants.
- `model_naming.rb` (2) — `convert_to_model` / `model_name_from_record_or_class`,
  which `record_identifier.rb` includes.

`RecordIdentifier` is reached from actionpack as well as from view helpers —
`dom_id` is part of the public rendering contract — which is why it is in this
slice rather than in the helper campaign.

`flows.ts` already exists in `packages/actionview/src/`, so `view_flow`'s value
type is present; confirm its shape before wiring `_prepare_context`.

## Converged shape

`context.ts`, `record-identifier.ts`, `model-naming.ts` under
`packages/actionview/src/`, with the two modules mixed in at Rails' sites via
the repo's module-mixin idiom.

## Acceptance criteria

- The three Ruby files report 0 missing in
  `pnpm parity:api --package actionview`.
- `domId` answers Rails' spelling for a persisted record, a new record, and a
  record with a prefix.
- `Base` obtains `viewFlow` through `_prepareContext`, not through a
  hand-assigned field.
