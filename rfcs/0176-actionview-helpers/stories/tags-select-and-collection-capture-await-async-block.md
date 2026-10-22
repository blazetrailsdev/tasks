---
title: "Tags::Select and render_collection_for await an async capture block"
status: in-progress
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: trails#9246
claim: "2026-10-22T18:53:35Z"
assignee: "included-mixins-overridable-beyond-conversion"
blocked-by: null
closed-reason: null
---

## Context

trails#9195 made every `capture` caller in `packages/actionview/src/helpers/` wait for an async block. Two callers in `helpers/tags/` were left out and still treat the result as a sync `SafeBuffer`:

- `Tags::Select#initialize` (`packages/actionview/src/helpers/tags/select.ts:35`). Rails is `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/select.rb:11`: `@choices = block_given? ? template_object.capture { yield || "" } : choices`. The value is captured in the constructor, and a JS constructor cannot await, so `@choices` can be a pending Promise.
- `CollectionHelpers#render_collection_for` (`packages/actionview/src/helpers/tags/collection-helpers.ts:212`). Rails is `collection_helpers.rb:86-92`. With an async block, each per-item capture returns a Promise, and `renderCollection` joins them.

`FormBuilder#fields_for_nested_model`'s async arm (`form-helper.ts`) has no test, because it needs a model with an association.

## Acceptance criteria

- `Select`'s block arm and `render_collection_for` handle an async block the way `formTag` / `contentTag` do, carrying `@inventedArm if/then — CONVERGEABLE output-buffer-capture-async-block-converge`. For `Select`, wait for the choices at `render` instead of in the constructor.
- Add a test per caller that awaits `render(plain:)` inside the block and asserts it lands in the output. Do the same for the `fields_for` nested-model arm, using a canonical model with an association.
