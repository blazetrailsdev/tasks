---
title: "has-one-set-new-record-displaced-removal"
status: in-progress
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4899
claim: "2026-07-16T01:31:11Z"
assignee: "has-one-set-new-record-displaced-removal"
blocked-by: null
closed-reason: null
---

## Context

Discovered during review of PR #4898 (has-one-nonpersisted-owner-replace-removal),
which fixed the same class of gap on the `writer` path. Confirmed by probe against
that branch — this one is still open.

Rails' `HasOneAssociation#set_new_record`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:91-93`)
is `replace(record, false)`. The `false` only sets `save`, and per `replace`
(`:59-85`) `save` gates just two things: `transaction_if(save)` (`:68`) and
`if save && !record.save` (`:75`). The `remove_target!` call at `:69` runs
**regardless** — so building a new has_one over an existing target still
nullifies the displaced record's FK and clears its inverse in memory
(`remove_target!`'s else branch, `:104-115`; its DB save is separately gated on
`target.persisted? && owner.persisted?` at `:108`).

trails' `HasOneAssociation#setNewRecord`
(`packages/activerecord/src/associations/has-one-association.ts`) calls
`this.replace(record, false)`, and our `replace` override is in-memory-only —
it sets the new record's FK/inverse and assigns `this.target`, but never runs
`removeTargetBang` on the displaced record. `SingularAssociation#setNewRecord`
(`singular-association.ts:205-207`) has the same shape.

PR #4898 fixed the analogous branch on `writeImmediate`, which had gated the
whole removal on `owner.isPersisted()`. The `build` path was left alone there to
keep that PR scoped to its story.

Probe against PR #4898's branch — a persisted pirate with a loaded ship, then
`pirate.association("ship").build({ name: "brand new" })`:

- displaced ship `pirate_id` after build: `959118196` (Rails: `nil`)
- displaced ship inverse `pirate` target after build: still set (Rails: cleared)

## Acceptance criteria

- [ ] The `build<Name>` / `setNewRecord` path runs the displaced record's
      removal (`removeTargetBang`) exactly as Rails' `replace(record, false)`
      does at `:69`, gating only the transaction and `record.save` on `save`.
- [ ] The displaced record's FK is nulled in memory and its inverse cleared;
      no DB write occurs unless `target.persisted? && owner.persisted?` (`:108`).
- [ ] Honors `:dependent` on this path the way `remove_target!` does
      (`:delete` at `:97-98`, `:destroy` at `:99-103`, else-nullify at `:104-115`).
- [ ] Note: the sync `build` accessor cannot await, so `needsTargetLoadForBuild()`
      (has-one-association.ts) already exists to pre-issue the `load_target`
      SELECT — the removal needs the same treatment. Check how the awaitable
      accessor in `builder/has-one.ts` threads this before designing the fix.
- [ ] Add a test with a persisted owner and a loadable displaced target
      asserting the in-memory nullify plus cleared inverse after `build`.
- [ ] No regression in the has_one / has_one_through / autosave suites.
