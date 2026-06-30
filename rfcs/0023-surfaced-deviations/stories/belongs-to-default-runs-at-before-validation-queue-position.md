---
title: "belongs_to default hoisted ahead of before_validation queue (sync-chain deviation)"
status: claimed
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-30T16:56:44Z"
assignee: "belongs-to-default-runs-at-before-validation-queue-position"
blocked-by: null
---

## Context

PR #4305 (belongs-to-default-with-required-before-validation) made
`belongsTo(name, { default, optional: false })` save cleanly by resolving the
possibly-async default block in an async pre-validation phase
(`Base#_runBelongsToDefaults`, `packages/activerecord/src/base.ts`) invoked from
`save` before `performValidations` (`packages/activerecord/src/persistence.ts`),
plus a synchronous `before_validation` callback registered by
`BelongsTo.addDefaultCallbacks`
(`packages/activerecord/src/associations/builder/belongs-to.ts`).

Deviation (raised 3× in Codex review on #4305): Rails registers the default as a
normal `before_validation` callback
(`activerecord/lib/active_record/associations/builder/belongs_to.rb:103-106` via
`activemodel/lib/active_model/validations/callbacks.rb:55-60`) calling
`BelongsToAssociation#default`
(`activerecord/lib/active_record/associations/belongs_to_association.rb:46-48`)
at its queue position. trails hoists the awaited default ahead of the entire
`before_validation` queue, so a user `before_validation` callback registered
before/after `belongsTo` cannot observe Rails' relative ordering with the
default (it always sees the post-default state on the save path).

Root cause: the default block may be async (`() => Developer.first()`) and
trails' validation callback chain is strictly synchronous — `runAllCallbacks(...,
"validation", ..., { strict: "sync" })` throws on any Promise (the ratified
sync-only-validations architecture; see `validations.ts#isValid`). An awaited
default cannot run at its queue position inside the sync chain, so it is hoisted.
Same governing constraint as the documented ORDERING DEVIATION in
`persistence.ts` and the sibling story `async-before-validation-sync-chain`.

## Acceptance criteria

- The belongs_to `default` block runs at its registered `before_validation`
  queue position relative to user-defined `before_validation` callbacks,
  matching Rails — i.e. a user callback registered before `belongsTo` runs
  before the default; one registered after runs after.
- Remove the hoisted `_runBelongsToDefaults` pre-pass and the
  `_belongsToDefaultsApplied` sentinel once the default runs in-queue.
- BLOCKED-ON-ARCHITECTURE: requires the strictly-synchronous validation chain to
  be revisited (an async-capable validation callback path). Schedule together
  with `async-before-validation-sync-chain` and the sync-only reconsideration;
  this is a no-op until that decision changes. Do not ratify the hoist.
