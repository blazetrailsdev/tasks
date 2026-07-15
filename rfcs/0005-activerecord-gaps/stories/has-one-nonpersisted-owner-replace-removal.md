---
title: "has-one-nonpersisted-owner-replace-removal"
status: claimed
updated: 2026-07-15
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-15T22:41:10Z"
assignee: "has-one-nonpersisted-owner-replace-removal"
blocked-by: null
closed-reason: null
---

## Context

Follow-up discovered during review of PR #4832 (d2-has-one-replacement-failure).

`HasOneAssociation#writeImmediate`
(`packages/activerecord/src/associations/has-one-association.ts`) branches on
`owner.isPersisted()`: only a persisted owner routes through `persistImmediate`
(which runs `remove_target!` + save); a non-persisted owner falls to bare
`this.replace(record)`, which never removes the displaced target. This predates
PR #4832 (confirmed against `origin/main`).

Rails' `HasOneAssociation#replace` (`has_one_association.rb:64-84`) does
`save &&= owner.persisted?` and then `transaction_if(save)` — with `save` false
the block **still runs**, so `remove_target!` fires (`:66,69`); only
`record.save` is gated (`:75`). `remove_target!`'s else branch itself gates the
displaced record's DB save on `target.persisted? && owner.persisted?`
(`:108`), so on a new owner it performs the in-memory nullify +
`remove_inverse_instance` and skips the save.

Reachable when a new-record owner has its PK set (`Pirate.new(id: 42)`), where
`foreignKeyPresent` is true (has-one-association.ts:216-223) and `loadTarget`
can materialize a real displaced row. Trails leaves it attached; Rails nullifies
its FK in memory and clears the inverse.

## Acceptance criteria

- [ ] `writeImmediate` runs the displaced-record removal even for a
      non-persisted owner (in-memory nullify + `removeInverseInstance`), gating
      only the new record's save on `owner.persisted?` — mirror Rails'
      `save &&= owner.persisted?` + `transaction_if(save)` semantics.
- [ ] Add a test with a new-record owner carrying a PK and a loadable displaced
      target; assert the old target's FK is nulled in memory and its inverse
      cleared, and no premature save occurs.
- [ ] No regression in the has_one / has_one_through / autosave suites.
