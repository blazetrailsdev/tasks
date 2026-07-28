---
title: "Nested-attributes id/updateOnly update on an unloaded has_one defers to the post-save flush"
status: ready
updated: 2026-07-28
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling gap of the bug PR #5456 fixed, one branch over in the same function.

`assignNestedAttributesForOneToOneAssociation`
(`packages/activerecord/src/nested-attributes.ts`) has three arms. #5456 fixed
the _build_ arm: an unloaded, persisted has_one is now discovered and detached
at assignment via `HasOneAssociation#detachDisplacedForSyncBuild`.

The _update_ arm is still blind. When `id` or `updateOnly` is supplied but the
target is not in memory, the writer calls `storePendingNestedAttributes` and
defers the whole thing to the async post-save flush
(`processNestedAttributes`) — see the comment "An `id`/`update_only` update
whose target is not in memory: defer it to the async post-save flush
(trails-specific ...)".

Rails does it synchronously at assignment: `existing_record = send(association_name)`
(`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:436`), which
loads the association, and then assigns (or marks for destruction) in place. So
in Rails the update is observable on the in-memory graph before any `save`, and
`_destroy` participates in validations against the post-destroy graph; in trails
it is invisible until the owner is saved.

Now that the build arm has a working assignment-time load with a drain
(`_pendingDisplacedRemovals`), the same mechanism can carry this arm.

## Acceptance criteria

- [ ] An `id`/`updateOnly` nested-attributes assignment whose target is unloaded
      loads it at assignment and assigns in place, matching
      `nested_attributes.rb:436`, rather than deferring to the post-save flush.
- [ ] The updated (or destruction-marked) record is observable on the owner
      before `save()`, and via the awaitable `set#{Name}Attributes` writer.
- [ ] Regression test verified failing on the pre-fix baseline.
- [ ] The "defer it to the async post-save flush" deviation comment is removed
      once converged.
