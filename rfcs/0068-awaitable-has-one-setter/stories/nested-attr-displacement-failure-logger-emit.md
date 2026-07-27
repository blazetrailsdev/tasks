---
title: "Announce a parked displacement-removal failure through Base.logger"
status: in-progress
updated: 2026-07-27
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5454
claim: "2026-07-27T20:58:24Z"
assignee: "nested-attr-displacement-failure-logger-emit"
blocked-by: null
closed-reason: null
---

## Context

PR #5441 made a failed nested-attributes displacement removal _non-discardable_
(sticky `_displacedRemovalFailure` on the owner, rethrown by every drain) and
added the awaitable `set#{Name}Attributes` writer that raises at the assignment
point. One gap remains: the failure is only ever _announced_ when someone
drains. Construct or assign, have the removal fail, and never touch the record
again, and nothing is emitted at all.

Rails raises `RecordNotSaved` inline from `remove_target!`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:105-112`),
so the failure is always announced. A JS property setter cannot raise on an
async write (see the docstring on `detachDisplacedAtAssignment`,
`packages/activerecord/src/nested-attributes.ts`), so the closest analogue is to
emit through `Base.logger` (`packages/activerecord/src/base.ts:1691-1709`) at the
moment the error is parked in `recordDisplacedRemovalFailure`. The sticky rethrow
then becomes the backstop rather than the only signal.

Agreed in the #5441 review thread; deliberately left out of that PR to keep the
contract change and the logging change separable.

## Acceptance criteria

- [ ] `recordDisplacedRemovalFailure` emits the failure through `Base.logger`
      when it parks the first error.
- [ ] Nothing is emitted when the removal succeeds.
- [ ] The existing sticky-rethrow behaviour and its tests are unchanged.
- [ ] A test asserts the emit happens with no drain and no `save()`.
