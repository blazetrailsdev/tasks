---
title: "has_one create over an unloaded target does not detach the prior row"
status: closed
updated: 2026-07-17
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4910
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the has_one-awaitable-setter RFC (maintainer decision on the has_one displacement cluster #4899/#4901/#4908/#4910). PR #4910 closed unmerged: the deferral machinery it patches (queueWrite/_removeDisplacedFromDb/_displacedRecords/removeDisplaced + unordered-LIMIT-1 fidelity path) is being retired wholesale in favor of an awaitable setter that errors on a persisted owner. Not abandoned — folded into the new RFC."
---

## Context

Follow-up discovered during PR #4904
(has-one-loaded-target-create-missing-remove-target), which fixed the
already-**loaded** target create/build detach. That PR deliberately scoped
`HasOneAssociation#_createRecord`
(`packages/activerecord/src/associations/has-one-association.ts`) to
`displaced = this.loaded ? this.target : null`, so a bare
`owner.createChild()` over an **unloaded** existing DB row does NOT detach the
old row — leaving two FK-matching rows attached.

Distinct from `has-one-unloaded-displacement-create-window`, which covers an
unloaded target displaced by a _deferred property-setter_ (`owner.child = other`
then `createChild()`, driven by `queueWrite` / `_removeDisplacedFromDb`). Here
there is no setter at all — just `createChild()` on an owner whose has_one was
never materialized.

Why PR #4904 scoped it out: Rails runs `remove_target!` inside
`HasOneAssociation#replace` via `set_new_record` → `replace(record, false)`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-69`),
but only AFTER `SingularAssociation#_create_record` has already `record.save`d
the new row (singular_association.rb:67-73). So `replace`'s leading
`load_target` sees TWO FK-matching rows and `.first` is order-undefined — Rails'
own behaviour here is ambiguous. The trails create path saves the new record
inside `super._createRecord` before we could load the old target, so we cannot
cheaply capture an unambiguous displaced record.

## Acceptance criteria

- [ ] Decide the convergence target: does Rails reliably detach the OLD row on
      `create_child` over an unloaded existing row, or is it genuinely
      order-undefined? Probe against a real MySQL/PG/sqlite Rails run before
      building — do not assume.
- [ ] If reliably detachable: restructure so the old target is materialized
      BEFORE the new record is saved (mirroring `replace`'s `load_target`
      running against a single pre-insert row), then detach it via
      `detachDisplacedTarget` / `removeTargetBang` per `:dependent`.
- [ ] If order-undefined in Rails: document as a ratified deviation (owner
      sign-off) rather than inventing behaviour, and add a `.trails.test.ts`
      guard pinning the trails choice.
- [ ] Test the bare `createChild()` unloaded path (no property-setter
      assignment, target never loaded) for both the nullify and destroy
      `:dependent` arms.
- [ ] No regression in has_one / has_one_through / autosave suites.
