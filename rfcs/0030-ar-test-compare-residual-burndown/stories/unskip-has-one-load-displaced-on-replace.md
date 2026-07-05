---
title: "unskip-has-one-load-displaced-on-replace"
status: claimed
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-07-05T23:01:54Z"
assignee: "unskip-has-one-load-displaced-on-replace"
blocked-by: null
---

## Context

Spun out of `unskip-has-one-associations` (RFC 0030). That PR converged the
has_one `dependent: :destroy` cascade to seed the displaced/destroyed child's
inverse belongs_to with the owner so child `before_destroy` callbacks can read
the parent synchronously (`has-one-association.ts` `seedDestroyInverseOwner`),
un-skipping `HasOneAssociationsTest > dependence`.

The sibling Rails test `association change calls destroy`
(`packages/activerecord/src/associations/has-one-associations.test.ts`) remains
skipped: `firm.account = Account.new(...)` goes through the JS property setter,
which cannot `await`. The displaced account is therefore not loaded at queue
time, so `HasOneAssociation#persistReplace` has no `previousTarget` to
dependent-destroy and `destroyed_account_ids` stays empty.

Rails (`has_one_associations_test.rb` `test_association_change_calls_destroy`)
loads the current target synchronously on assignment and destroys it.

## Acceptance criteria

- On an unloaded property-setter replace of a `has_one` with `dependent:` set,
  `persistReplace` loads the existing DB-associated record and runs the
  dependent remove (destroy/delete/nullify) against it.
- Un-skip `HasOneAssociationsTest > association change calls destroy` in
  `packages/activerecord/src/associations/has-one-associations.test.ts`
  (test name verbatim) and have it pass on sqlite/pg/mysql.
- No regression in existing has_one / autosave replace tests.
