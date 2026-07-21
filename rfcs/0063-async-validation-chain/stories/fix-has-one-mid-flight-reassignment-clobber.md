---
title: "fix-has-one-mid-flight-reassignment-clobber"
status: claimed
updated: 2026-07-21
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-21T18:10:19Z"
assignee: "fix-has-one-mid-flight-reassignment-clobber"
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
the shared holder via `syncToAssociationInstance` (`packages/activerecord/src/associations.ts:1808`). A
reader still in flight when the caller reassigns the association overwrites the
new target with the stale queried row. Rails is immune because `find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248`)
is synchronous.

Three approaches were tried and rejected — do not re-derive them:

1. **Owner stale-key snapshot** (what `loadBelongsTo` does). Does not transfer:
   `stale_state` is non-nil only on `BelongsToAssociation`
   (`belongs_to_association.rb:164`), nil for foreign
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

**Two writebacks, not one.** A fix must cover both `syncToAssociationInstance`
in the inner loader (`packages/activerecord/src/associations.ts:1808`) **and** the instance wrapper's own
unconditional `setTarget` (`packages/activerecord/src/associations/instance-methods.ts:176`), which
re-syncs after the inner call returns. Guarding only the inner one leaves the
clobber reachable through `record.loadHasOne(name)` and the `firm.account`
accessor that routes to it.

**Preferred direction — mirror Rails' structure instead of guarding.** Rails
makes this race unrepresentable rather than detecting it. `async_load_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:199`)
assigns the **Promise itself** to `@target` synchronously; the `target` reader
(`association.rb:53-57`) resolves it lazily with
`@target = @target.value if @target.is_a?(Promise)`. A mid-flight reassignment
goes through `target=` (`association.rb:102-105`), which overwrites `@target`
— Promise included — so the in-flight result becomes unreachable and is
dropped. Nothing writes back after the await, so there is no conflict to
detect. The pending result is reachable only _through the slot it would
overwrite_.

Porting that shape (holder stores the pending promise; the reader resolves it;
writers overwrite the slot) removes both writeback sites rather than guarding
them, and is strictly better than the fallback below.

Fallback if that restructuring proves too invasive: give the holder a
**load-generation token** — the loader
captures it before querying and only writes back if it is unchanged, so "our
own load's writeback" is distinguishable from "someone else's set" rather than
inferred. Note the same writeback shape exists in `loadHasMany`
(`packages/activerecord/src/associations.ts:2114`); check whether it needs the same treatment.

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
