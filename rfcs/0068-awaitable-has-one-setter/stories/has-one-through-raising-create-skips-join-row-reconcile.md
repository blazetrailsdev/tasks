---
title: "has-one-through-raising-create-skips-join-row-reconcile"
status: draft
updated: 2026-07-25
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps:
  - has-one-through-create-unloaded-join-row-not-reconciled
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SingularAssociation#_create_record`
(`vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:63-71`)
runs `set_new_record(record)` — and therefore the whole of
`HasOneThroughAssociation#create_through_record`
(`has_one_through_association.rb:15-40`), including the persisted-join-row
`through_record.update(attributes)` arm at :33 — BEFORE
`raise RecordInvalid.new(record) if !saved && raise_error`.

In trails, `HasOneThroughAssociation#_createRecord`
(`packages/activerecord/src/associations/has-one-through-association.ts`) runs
the async join-row reconcile (`persistReplace(false)`) AFTER `await
super._createRecord(...)`. The `RecordInvalid` throw happens inside that `super`
call (`associations/singular-association.ts`, the `if (!saved && shouldRaise)`
arm), so on a raising `create#{name}!` whose child fails validation the reconcile
is skipped entirely. Rails would still have updated an existing, persisted (but
UNLOADED) join row before raising.

Found in review of PR #5326 (story
has-one-through-create-unloaded-join-row-not-reconciled), which ported the
non-raising create reconcile. Left out of that PR because reproducing it needs a
validation-failing through _source_ model, and the canonical `Club`
(`vendor/rails/activerecord/test/models/club.rb`) declares no validations — Rails
has no test for this shape either, so pinning it needs a canonical model that can
fail validation (check the existing canonical models before adding anything).

Note the resulting Rails behavior is itself odd and should be verified against
real Rails before being enshrined: `construct_join_attributes` yields
`{ club: record }` with an unsaved `record`, so the join row's `club_id` is
rewritten toward a record that was never persisted.

## Acceptance criteria

- [ ] Determine, against vendored Rails, what `create#{name}!` with a failing
      child and an existing persisted-but-unloaded join row actually writes.
- [ ] Make trails match: the join-row reconcile must run before `RecordInvalid`
      propagates out of `HasOneThroughAssociation#_createRecord`.
- [ ] Regression test in `has-one-through-associations.test.ts` using canonical
      models/fixtures only; must fail on baseline.
- [ ] has_one / has_one_through suites stay green; `test:compare` delta
      non-negative.
