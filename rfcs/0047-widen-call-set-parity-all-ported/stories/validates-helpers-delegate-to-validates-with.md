---
title: "validates_*_of helpers delegate to validatesWith + accept multiple attrs"
status: draft
updated: 2026-06-24
rfc: "0047-widen-call-set-parity-all-ported"
cluster: real-omission
deps:
  - wide-call-set-significant-knob-and-baseline
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `validates_*_of` helper macros each delegate to `validates_with` with the
matching validator class and `_merge_attributes(attr_names)`:

- `validates_presence_of` → `validates_with PresenceValidator, _merge_attributes(attr_names)`
  (`vendor/rails/activemodel/lib/active_model/validations/presence.rb:35`)
- and likewise absence.rb:29, length.rb:124, numericality.rb:218, format.rb:108,
  inclusion.rb:43, exclusion.rb:45, acceptance.rb:109, confirmation.rb:76,
  comparison.rb:86 — all `validates_with <X>Validator, _merge_attributes(attr_names)`.

trails reimplements these in `packages/activemodel/src/model.ts` (statics at
lines 688 `validatesPresenceOf`, 700 `validatesAbsenceOf`, 712
`validatesLengthOf`, 719 `validatesNumericalityOf`, 729 `validatesInclusionOf`,
736 `validatesExclusionOf`, 743 `validatesFormatOf`, 750 `validatesAcceptanceOf`,
757 `validatesConfirmationOf`, 761 `validatesComparisonOf`, 765
`validatesSizeOf`) by calling `this.validates(attr, { presence: … })` instead of
`validatesWith(XValidator, …)`. Two concrete divergences:

1. **Path**: they bypass `validatesWith` (which trails _does_ have —
   `packages/activemodel/src/validations.ts:158`) and the `_merge_attributes`
   normalization, so options handling (`:allow_nil`, `:allow_blank`, `:strict`,
   `:if`/`:unless`, `:on`) may not match Rails exactly.
2. **Arity**: several TS signatures take a single `attribute` + options
   (`validatesLengthOf(attribute, options)`, `validatesNumericalityOf`,
   `validatesInclusionOf`, …) and cannot accept multiple `attr_names` the way
   Rails' `validates_length_of :a, :b, …` does.

Wide call-set flag fires `validates_with` on all `validates_*_of` helpers in
`model.ts`.

## Acceptance criteria

- The `validates_*_of` helpers delegate to `validatesWith(XValidator,
mergeAttributes(attrNames, options))` (the faithful port of Rails'
  `validates_with X, _merge_attributes(attr_names)`), OR a documented confirmed
  equivalent is recorded in the wide baseline with proof the option/arity
  semantics match.
- Multi-attribute forms (`validatesLengthOf("a", "b", { … })` etc.) accepted,
  matching Rails' `*attr_names` arity.
- Option pass-through (`allowNil`, `allowBlank`, `strict`, `if`, `unless`, `on`)
  matches Rails, covered by tests named to match the ActiveModel validation
  tests (read them first).
- The wide call-mismatches artifact no longer flags `validates_with` for these
  pairs.
- File scope stays within `model.ts` (+ the validator files / tests it needs);
  no overlap with in-flight 0044/0045 activemodel stories — check
  `pnpm tasks list`.

## Out of scope

- `validatesEach` / `validatesWith` themselves (already ported).
- Restructuring `this.validates` DSL.
