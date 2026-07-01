---
title: "Support reject_if: :all_blank symbol form in acceptsNestedAttributesFor"
status: ready
updated: 2026-06-24
rfc: "0052-nested-attributes-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails resolves the `reject_if: :all_blank` symbol to its shared
`REJECT_ALL_BLANK_PROC` inside `accepts_nested_attributes_for`
(`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:302` and the
symbol-resolution branch in `accepts_nested_attributes_for`). trails'
`acceptsNestedAttributesFor` (`packages/activerecord/src/nested-attributes.ts`)
only accepts a **function** for `rejectIf` — there is no symbol/string form.

As a result, the canonical `Pirate` model
(`packages/activerecord/src/test-helpers/models/pirate.ts`) had to inline a
local `rejectAllBlank` proc (merged in PR #4075) instead of declaring
`rejectIf: "all_blank"`. This diverges from Rails' declaration surface and means
each canonical model that wants `:all_blank` must re-implement the proc.

Rails also exposes `nested_attributes_options[name][:reject_if]` as a `Proc`
after resolution (asserted in
`vendor/rails/activerecord/test/cases/nested_attributes_test.rb:31-34`), which
trails does not currently model symbolically.

## Acceptance criteria

- `acceptsNestedAttributesFor` accepts `rejectIf: "all_blank"` (string/symbol
  form) and resolves it to a shared `REJECT_ALL_BLANK_PROC` equivalent matching
  `nested_attributes.rb:302` (skip `_destroy`, `isBlank` on every other value).
- Convert the inline `rejectAllBlank` in the canonical `Pirate` model to the
  symbolic form once supported.
- No test:compare or api:compare regression.
