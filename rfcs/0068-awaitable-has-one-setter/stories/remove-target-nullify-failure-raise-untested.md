---
title: "remove_target! nullify-failure RecordNotSaved raise has no coverage"
status: claimed
updated: 2026-07-27
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-07-27T19:23:50Z"
assignee: "remove-target-nullify-failure-raise-untested"
blocked-by: null
closed-reason: null
---

## Context

`remove_target!`'s nullify arm raises `RecordNotSaved` when the displaced
record fails to save after its foreign key is set to nil
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:102-115`).
trails ports that in `removeTargetBang`
(`packages/activerecord/src/associations/has-one-association.ts`), including the
`setOwnerAttributes(target)` restore before raising.

That raise path has no test. PR #5290 routed the nested-attributes displacement
removal through it (`removeDisplacedRecord`) and could not add coverage: it
needs a displaced record that fails to save once its FK is nil, and no canonical
model in `packages/activerecord/src/test-helpers/models/` has a validation that
fails on a nil owner FK. Inventing a bespoke model for it is barred by
CLAUDE.md's canonical-models rule.

Check `vendor/rails/activerecord/test/models/` for an existing model with a
`validates_presence_of` on its has_one owner FK (or a `belongs_to ...,
optional: false` equivalent) that we have not ported yet — mirroring that is the
right way in, rather than adding a validation to a canonical model we already
mirror.

## Acceptance criteria

- [ ] A test drives `removeTargetBang`'s nullify arm to a failed save and
      asserts `RecordNotSaved` with Rails' message ("Failed to remove the
      existing associated ...").
- [ ] The test asserts the owner attributes are restored on the displaced
      record before the raise (the `set_owner_attributes` restore).
- [ ] Only canonical models/tables are used; if a model needs the validation,
      it mirrors a real `vendor/rails/activerecord/test/models/` model.
