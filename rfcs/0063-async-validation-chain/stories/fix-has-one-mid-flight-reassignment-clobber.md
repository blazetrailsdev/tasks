---
title: "fix-has-one-mid-flight-reassignment-clobber"
status: ready
updated: 2026-07-20
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The audit story `audit-singular-loader-mid-flight-reassignment-clobber` (PR #5009)
confirmed the mid-flight reassignment clobber PR #4919 fixed in
`loadBelongsTo` **is also reproducible in `loadHasOne`**, but concluded no
sound fix is available with today's holder bookkeeping. The audit shipped a
skipped repro
(`packages/activerecord/src/associations/has-one-mid-flight-reassignment.trails.test.ts`);
this story is the fix.

The bug: `loadHasOne` awaits DB I/O, then unconditionally writes the result to
the shared holder via `syncToAssociationInstance` (`associations.ts:1838`). A
reader still in flight when the caller reassigns the association overwrites the
new target with the stale queried row. Rails is immune because `find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:194`)
is synchronous.

Three approaches were tried and rejected — do not re-derive them:

1. **Owner stale-key snapshot** (what `loadBelongsTo` does). Does not transfer:
   `stale_state` is non-nil only on `BelongsToAssociation`
   (`associations/belongs_to_association.rb:126`), nil for foreign
   associations, and the owner's PK does not move on reassignment.
2. **False→true flip in holder loaded-ness.** Unsound and actively harmful.
   The association machinery marks holders loaded mid-await on its own —
   observed on the plain has_one `Member#currentMembership` during a `:through`
   hop — so the guard fires on ordinary loads and returns a stale target over a
   correct result. Fails `has-one-through-associations.test.ts:416` ("set
   record after delete association") on PostgreSQL and MariaDB while passing on
   SQLite, where timing keeps it from firing. This is why #5009 reverted.
3. **`_explicitTarget`.** Misses the real path: the has_one writer never sets
   it, so the guard would never fire on an actual reassignment.

Likely direction: give the holder a **load-generation token** — the loader
captures it before querying and only writes back if it is unchanged, so "our
own load's writeback" is distinguishable from "someone else's set" rather than
inferred. Note the same writeback shape exists in `loadHasMany`
(`associations.ts:2144`); check whether it needs the same treatment.

Reproduce on a real adapter: SQLite hides both the bug and the bad fix.

## Acceptance criteria

- Un-skip the three tests in
  `has-one-mid-flight-reassignment.trails.test.ts` and make them pass.
- `has-one-through-associations.test.ts` stays green **on PostgreSQL and
  MariaDB**, not just SQLite (specifically "set record after delete
  association").
- The guard distinguishes the loader's own writeback from an external set by
  construction, not by inferring from holder state.
- Rails parity rationale documented at the call site (the deviation is
  unavoidable; `find_target` is sync).
