---
title: "has_one writer defers persistence to save() instead of persisting on assignment"
status: closed
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: 3722
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by has-one-writer-queue-until-save; PR #3722 closed unmerged (persist-on-assignment via sync setter needs a rejected floating promise)"
---

## Context

Surfaced while converting `has-one-associations.test.ts` to canonical models
(PR #3585, story `assoc-has-one-shared-tables`).

Rails persists a `has_one` write **on assignment to a saved owner**: e.g.
`company.account = account` immediately nullifies/destroys the displaced record
and saves the new one (`test_has_one_transaction` asserts
`assert_queries_count(3)` for the assignment; `test_association_change_calls_delete`
and `test_nullification_on_association_change` assert the effect with **no**
`save()` call). trails instead **defers** the writes to the owner's next
`save()` — the assignment runs 0 queries and the displaced-record
nullify/delete/destroy happens only when `owner.save()` runs.

Evidence (DEVIATION comments added in PR #3585):

- `has-one-associations.test.ts` "has one transaction" — the
  `company.account = Account.find(2)` reassignment runs 0 queries in trails vs
  Rails' 3.
- "association change calls delete" / "nullification on association change" —
  required an inserted `await firm.save()` the Rails bodies don't have.

Impl: `HasOneAssociation#replace` records a `_pendingReplace` and
`persistReplace` runs on owner save (`associations/has-one-association.ts`),
rather than persisting inside `replace`/`writer`.

This also blocks faithful ports of `assignment before child saved` and
`create when parent is new raises` (see `assoc-has-one-unskip-residual`).

## Acceptance criteria

- [ ] Converge `has_one` writer to persist on assignment to a saved owner
      (nullify/delete/destroy the displaced record + save the new one
      immediately), matching Rails `HasOneAssociation#replace`.
- [ ] Un-skip / de-DEVIATION the affected `has-one-associations.test.ts` tests
      (drop the inserted `save()` calls and DEVIATION comments; assert Rails'
      query counts).
- [ ] No regression in the broader association suite (the deferred
      `persistReplace`-on-save path is exercised by Pirate/Ship tests).
