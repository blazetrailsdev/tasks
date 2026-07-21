---
title: "fix-has-many-mid-flight-reassignment-clobber"
status: closed
updated: 2026-07-21
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5038
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded: the _targetPromise redesign in #5035 covers collections too. The counter-based guard broke three tests that mutate collection targets mid-load by design; a promise slot is untouched by those mutations, so loadHasMany is now guarded in #5035 with the reproducer as a passing test."
---

## Context

`fix-has-one-mid-flight-reassignment-clobber` (PR #5035) fixed the mid-flight
reassignment clobber in `loadHasOne` with a load-generation token on the
holder (`Association#_targetGeneration`). The **same bug is reproducible in
`loadHasMany`**, and is NOT fixed by that PR — see the NOTE at the
`syncToAssociationInstance` call at the end of `loadHasMany` in
`packages/activerecord/src/associations.ts`.

Verified reproducer (fails on `main`, returns 3 rows instead of the assigned 1):

```ts
const firm = (await Firm.first()) as Firm;
const other = (await Client.first()) as Client;
const inFlight = firm.association("clients").loadTarget();
firm.association("clients").setTarget([other]);
await inFlight;
expect(firm.association("clients").target).toEqual([other]);
```

**Why the has_one fix does not transfer — already tried, do not re-derive.**
Applying the identical treatment to `loadHasMany` (capture
`_captureTargetGeneration` before the query, `_reclaimedTarget` +
`_writeBackLoadedTarget` at the tail) makes the reproducer pass but breaks
three tests, because collection holders are mutated mid-load _on purpose_
(dirty targets, in-memory built/pushed records, target merging), so a
generation snapshot rejects legitimate writebacks:

- `associations/has-many-associations.test.ts` — "finder bang method with
  dirty target"
- `associations.test.ts` — "target merging ignores persisted in memory records
  when loaded records are empty"
- `associations.test.ts` — "loading the association target should load most
  recent attributes for child records marked for destruction"

So the collection case needs a signal that separates "the proxy mutated its
own target during this load" from "someone replaced the target wholesale" —
the generation counter alone conflates them.

Rails is immune throughout because `find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248`)
is synchronous; the deviation is unavoidable, so it must be justified at the
call site.

## Premise revised 2026-07-21 (owner decision, during #5038 review)

The original premise below — pick a winner for the race, and let the
assignment win — was **rejected by the owner**. Silently discarding either
side is a footgun: discarding the assignment loses a caller's explicit
intent, discarding the load hides a wasted query, and neither is diagnosable
after the fact.

**Revised behaviour: refuse the race.** Replacing an association's target
while a load for it is still in flight raises the new
`AssociationTargetReplacedDuringLoad` (`errors.ts`). This supersedes the
reproducer in the Context section, which asserted the assignment wins — it
now raises instead.

Measured before adopting: throwing breaks **zero** Rails-ported tests (2001
pass in `associations/` + `associations.test.ts`; also clean across
`autosave-association`, `nested-attributes`, `base`). No legitimate internal
path assigns a target mid-load, because the loader's own writeback bails via
`_loaderWritebackSuppressed` before reaching `setTarget`.

This also made the original "signal that separates proxy self-mutation from
wholesale replacement" criterion moot: if the clobber raises at the point of
assignment it can never occur, so the `_setTargetCount` counter and the guard
in `CollectionAssociation#loadTarget` were both deleted. `collection-association.ts`
is untouched by the final diff.

## Acceptance criteria

- Replacing a has_many target mid-load raises
  `AssociationTargetReplacedDuringLoad`; assigning after the load settles is
  still allowed.
- The raise cannot fire for a loader's own writeback — that distinction is by
  construction (`_loaderWritebackSuppressed`), not inferred from holder state.
- The three tests listed above stay green, on **PostgreSQL and MySQL**, not
  just SQLite (SQLite timing hides both the bug and bad fixes).
- Rails parity rationale documented at the call site and on the error class:
  Rails raises nothing here because `find_target` is synchronous, so this
  error is a deliberate trails-only invention, not a porting gap.
