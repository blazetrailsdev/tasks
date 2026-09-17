---
title: "Drop invented typeof guards from has_one/belongs_to touch callbacks"
status: draft
updated: 2026-09-17
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HasOne.addTouchCallbacks` (`packages/activerecord/src/associations/builder/has-one.ts:112-119`) passes
`if: (record) => typeof record.isSavedChanges === "function" && record.isSavedChanges()`.
Rails `activerecord/lib/active_record/associations/builder/has_one.rb` `add_touch_callbacks` registers
`model.after_create callback, if: :saved_changes?` / `model.after_update callback, if: :saved_changes?`
with no `respond_to?` guard. #7851 added the unguarded form in `belongs-to.ts` (`builder/belongs_to.rb:95-96`).
`BelongsTo.addTouchCallbacks` in `belongs-to.ts` still has the same duck-typed guards on its
counter-cache arm (`typeof record.isSavedChanges === "function"`, `typeof assoc.isSavedChangeToTarget`),
diverging from `belongs_to.rb:88-93`.

## Acceptance criteria

- `has-one.ts` touch callbacks call `record.isSavedChanges()` with no `typeof` guard.
- `belongs-to.ts` counter-cache touch arm mirrors `belongs_to.rb:88-93` without `typeof` guards.
- Related association/touch tests stay green.
