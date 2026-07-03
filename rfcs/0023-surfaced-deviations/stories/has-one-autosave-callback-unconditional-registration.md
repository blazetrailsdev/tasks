---
title: "has_one autosave callback should register unconditionally (not gated on options.autosave)"
status: in-progress
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4480
claim: "2026-07-03T13:21:53Z"
assignee: "has-one-autosave-callback-unconditional-registration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `has-one-through-associations.test.ts` (RFC 0023,
`hasone-through-write-side-and-nil-stale-gaps`, PR #4469).

trails gates the has*one autosave callbacks on the reflection's `autosave`
option: `addAutosaveAssociationCallbacks` (autosave-association.ts:1238-1252)
registers the `afterCreate`/`afterUpdate` `saveHasOneAssociation` runners but
each returns early unless `assocDef?.options?.autosave` is truthy. Rails
registers `save_has_one_association` for `after_create`/`after_update`
**unconditionally** (autosave_association.rb `add_autosave_association_callbacks`,
`elsif reflection.has_one?` branch — no autosave-option gate); the option only
governs whether \_existing/changed* children are re-saved and validated, while a
**new** child is always persisted via `_record_changed?` → `record.new_record?`
(autosave_association.rb `save_has_one_association`).

Effect: in trails a lone built has_one child (e.g. `member.build_current_membership`
or a directly-built join record) is never written on `owner.save` unless a
`_pendingReplace` was queued (the writer path). PR #4469 worked around this for
has_one_through by queueing the built join record onto the through association's
`_pendingReplace` (`constructThroughRecordInMemory` in
has-one-through-association.ts) so `flushPendingReplaces` persists it. That is a
targeted patch; the general deviation remains and is the suspected root cause of
the PG/MariaDB lone-has_one-child gap tracked in
`hasone-through-pg-maria-eager-and-autosave-gaps`.

Rails: `vendor/rails/activerecord/lib/active_record/autosave_association.rb`
(`add_autosave_association_callbacks`, `save_has_one_association`).
trails: `packages/activerecord/src/autosave-association.ts`.

## Acceptance criteria

- [ ] Register the has_one autosave `after_create`/`after_update` runner
      unconditionally (drop the `options.autosave` early-return), so a new
      has_one child is persisted on `owner.save` without a queued
      `_pendingReplace`, matching Rails. Keep the option's real semantics
      (re-saving/validating already-persisted children).
- [ ] Reconcile with the existing `_pendingReplace`/`flushPendingReplaces`
      path so has_one children are not double-saved.
- [ ] No regression in has_one / has_one_through / autosave suites; ideally
      the through-side workaround in `constructThroughRecordInMemory` can be
      simplified once the general path exists.
