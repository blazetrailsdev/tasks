---
title: "Awaitable collection ids assignment: update({...Ids}) arm + unpersisted ids= floating-promise race"
status: draft
updated: 2026-07-23
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5042 (RFC 0068) made persisted-owner collection assignment throw
(`CollectionPersistedAssignmentError`), including the `#{singular}Ids=` setter
and the mass-assignment hasMany/HABTM arm (`attribute-assignment.ts`,
`queueWrite` dispatch). Two ids-specific gaps were disclosed in that PR's body
and review but deliberately left out of scope:

1. **`await author.update({ postIds: [...] })` on a persisted owner now
   throws** even though `update` is already async in trails — mass-assignment
   runs through the synchronous `assignAttributes`, which cannot await the
   `queueIdsWrite` → `idsWriter` id-resolution query. Rails' `update` persists
   ids assignment inline (`ids_writer` → `replace`,
   `collection_association.rb:62-83`). An awaitable mass-assignment arm (or an
   `update`-level async assignment pass for association keys) would restore
   this Rails-legal call shape. In-repo precedent for the migration pain:
   `has-many-through-associations.test.ts` "has many through update ids with
   conditions" had to drop `update({...Ids})` for direct
   `association(name).idsWriter([...])` calls.

2. **`queueIdsWrite`'s unpersisted arm returns a floating promise**
   (`collection-association.ts`, documented at the definition in #5042): the
   sync `ids=` property setter discards the promise, so a failed id resolve
   (`raiseNotFoundAll`) surfaces as an unhandled rejection, and an immediate
   `save()` can race the in-flight resolution (the in-memory replace may land
   after the save reads the target). Kept in #5042 because the story's
   acceptance criteria retained unpersisted-owner assignment; the safe path is
   `await owner.association(name).idsWriter(ids)`.

Both stem from the same root: ids assignment inherently needs a DB query, so
no arm of the sync surface can be made faithful — unlike `records=`, where the
unpersisted arm is genuinely in-memory.

## Acceptance criteria

- [ ] A persisted owner can assign collection ids through an awaitable public
      surface with Rails' `update`-call ergonomics (either an async
      association-aware pass in `update`/`updateBang`, or an RFC-sanctioned
      awaitable sugar), ending in `ids_writer` → `replace` semantics.
- [ ] The unpersisted `ids=` floating promise is resolved: either the setter's
      hazard is closed (e.g. ids= throws on all owners once the awaitable
      surface exists, updating RFC 0068's design note) or the race with an
      immediate `save()` is eliminated; unhandled rejections must not be the
      failure mode for a bad id.
- [ ] `has many through update ids with conditions` migrates back to the
      `update({ ...Ids })` shape if the update-level pass is chosen.
- [ ] No test renames.
