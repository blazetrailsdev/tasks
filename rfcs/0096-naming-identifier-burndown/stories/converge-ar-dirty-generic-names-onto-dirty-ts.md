---
title: "converge-ar-dirty-generic-names-onto-dirty-ts"
status: ready
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
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

# Converge the AR dirty generics onto `attribute-methods/dirty.ts`

## Context

`ar-only-dirty-generics-live-on-activemodel-model` (PR pending) moved
`savedChangeToAttribute`, `savedChangeToAttributeValues`,
`willSaveChangeToAttribute` and `willSaveChangeToAttributeValues` off
`packages/activemodel/src/model.ts` and onto `Base`
(`packages/activerecord/src/base.ts`), beside the
`attribute_method_affix` / `attribute_method_suffix` declarations PR #6814 put
in `Base`'s `attributeMethodPatterns` static block.

They belong in `packages/activerecord/src/attribute-methods/dirty.ts`, the file
mirroring `activerecord/lib/active_record/attribute_methods/dirty.rb:150-240`.
They could not land there in that PR because the file already exports
record-taking functions under the SAME names with DIFFERENT return types:

- `savedChangeToAttribute(record, attr)` returns `[old, new] | null`
  (`dirty.rb:157-159`, the non-`?` reader); the method that moved onto `Base`
  returns a boolean and is really `saved_change_to_attribute?`
  (`dirty.rb:150-152`), which the file already ports as
  `isSavedChangeToAttribute`.
- The `*Values` spellings (`savedChangeToAttributeValues`,
  `willSaveChangeToAttributeValues`) have no Rails counterpart at all — Rails
  spells them `saved_change_to_attribute` and `attribute_change_to_be_saved`
  (`dirty.rb:157-159`, `193-195`), both of which the file already ports.

So the blocker is a NAMING divergence, not a layout one, and converging the
names is what unblocks the co-location.

`attributeBeforeLastSave` / `attributeInDatabase` are already correct: they live
in `attribute-methods/dirty.ts` and are mixed onto `Base.prototype` via the
include block at `base.ts:4880-4910`. A class-body definition in `base.ts` wins
over that mixin (`include()` never replaces a class-body method,
`activesupport/src/include.ts:273`) and silently displaces the correct AR
semantics — measured: it reds
`has-many-associations.test.ts` "counter cache updates in memory after update
with inverse of enabled", because AR's `attribute_in_database` reads
`attribute_change_to_be_saved`, not `attribute_was`. Whatever this story does
must not reintroduce that shadow.

## Acceptance criteria

- [ ] `savedChangeToAttributeValues` / `willSaveChangeToAttributeValues` are
      retired in favour of the Rails names (`savedChangeToAttribute` returning
      the pair, `attributeChangeToBeSaved`), with every call site updated.
- [ ] The boolean reader is spelled `isSavedChangeToAttribute` /
      `isWillSaveChangeToAttribute`, matching the existing ports.
- [ ] All four definitions live in
      `packages/activerecord/src/attribute-methods/dirty.ts`, and `base.ts`
      carries no class-body copy that would shadow the mixin.
- [ ] `parity:api` / `parity:test` deltas non-negative; `parity:api:calls` /
      `:args` add zero rows.
