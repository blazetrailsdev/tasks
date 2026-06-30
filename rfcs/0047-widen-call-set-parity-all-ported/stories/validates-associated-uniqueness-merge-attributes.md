---
title: "validatesAssociated/validatesUniquenessOf delegate through _mergeAttributes + multi-attr"
status: in-progress
updated: 2026-06-30
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: 1
pr: 4301
claim: "2026-06-30T01:24:31Z"
assignee: "validates-associated-uniqueness-merge-attributes"
blocked-by: null
---

## Context

`validatesAssociated` and `validatesUniquenessOf` (ActiveRecord) do NOT yet
delegate through `_merge_attributes(attr_names)` the way Rails does, so they
lack array flattening and multi-attribute support that
`validates-helpers-delegate-to-validates-with` (PR #4285) added to the other
five `validates_*_of` helpers.

Rails source:

- `activerecord/lib/active_record/validations/associated.rb:60-62` —
  `validates_with AssociatedValidator, _merge_attributes(attr_names)`
- `activerecord/lib/active_record/validations/uniqueness.rb:291-292` —
  `validates_with UniquenessValidator, _merge_attributes(attr_names)`
- `activemodel/lib/active_model/validations/helper_methods.rb:7-10` —
  `_merge_attributes` extracts the trailing options hash then `attr_names.flatten!`

Current trails state (`packages/activerecord/src/validations.ts`):

- `validatesAssociated` treats a trailing array as the options object and
  registers nothing for multi-attr/array forms.
- Uniqueness is exposed as `validatesUniqueness` (single `attribute: string`);
  the `validatesUniquenessOf(...attrNames)` interface entry has no matching
  flattening impl. Public typings were deliberately kept narrow
  (`string | Record<string, unknown>`) in PR #4285 to avoid advertising
  unsupported behavior — see the comment at `validations.ts` ValidationsClassMethods.

## Acceptance criteria

- `validatesAssociated` and `validatesUniquenessOf` delegate through
  `_mergeAttributes(attrNames)` and accept multiple / nested-array attr lists
  (Rails `*attr_names` arity), matching the AssociatedValidator / UniquenessValidator
  delegation in Rails.
- A real `validatesUniquenessOf` is wired (not just `validatesUniqueness`),
  matching Rails' helper name.
- Public typings widened to `AttrNameArg[]` (the type added in PR #4285) once the
  impls support it.
- Tests named to match the Rails AR association/uniqueness validation tests cover
  the multi-attribute / array forms.

## Out of scope

- The five helpers already converged in PR #4285 (presence/absence/length/size/
  numericality).
