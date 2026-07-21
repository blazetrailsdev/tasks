---
title: "Make _loaderWritebackSuppressed load-scoped, not holder-scoped"
status: draft
updated: 2026-07-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5038 introduced `Association#_loaderWritebackSuppressed`, a counter bumped
around `HasManyAssociation#doAsyncFindTarget` so a loader's own tail writeback
(`syncToAssociationInstance`, `associations.ts:1296`) does not trip the
mid-load-replacement guard in `setTarget`.

The flag is **holder-scoped, not loader-scoped** (documented at
`packages/activerecord/src/associations/association.ts` on the flag). While it
is set, `syncToAssociationInstance` bails for _every_ writeback into that
holder — including a genuinely different concurrent
`loadHasMany(owner, sameName, differentOptions)` carrying differently-scoped
rows. That second load still returns its rows to its own caller, but its holder
cache write is silently dropped; the first (driving) load's result wins the
holder.

Today this is benign — both are reads of the same association and last-writer
-wins on the holder cache is acceptable. It becomes a latent correctness quirk
if two concurrent loads with materially different scopes are ever expected to
each land their own rows in a per-scope cache.

## Acceptance criteria

- A concurrent `loadHasMany` with a different scope no longer has its holder
  writeback suppressed by an unrelated in-flight load — suppression keys off the
  driving _load_, not the holder.
- Mechanism: thread a per-load token through `loadHasMany` /
  `doAsyncFindTarget` so `syncToAssociationInstance` suppresses only the writeback
  belonging to the load that set the flag, rather than all writebacks in the
  window.
- The `setTarget` mid-load-replacement guard and its regression tests
  (`has-many-mid-flight-reassignment.trails.test.ts`) stay green on PostgreSQL
  and MySQL.
- If loader-scoping proves not worth the token-threading cost, close as
  wontfix with the measured reason rather than leaving the holder-scoped
  comment as the only record.
