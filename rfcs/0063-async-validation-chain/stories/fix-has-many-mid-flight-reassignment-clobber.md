---
title: "fix-has-many-mid-flight-reassignment-clobber"
status: claimed
updated: 2026-07-21
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-21T19:00:16Z"
assignee: "fix-has-many-mid-flight-reassignment-clobber"
blocked-by: null
closed-reason: null
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

## Acceptance criteria

- The reproducer above passes.
- The three tests listed above stay green, on **PostgreSQL and MySQL**, not
  just SQLite (SQLite timing hides both the bug and bad fixes).
- The guard distinguishes the loader's own writeback from an external
  replacement by construction, not by inferring from holder state.
- Rails parity rationale documented at the call site.
