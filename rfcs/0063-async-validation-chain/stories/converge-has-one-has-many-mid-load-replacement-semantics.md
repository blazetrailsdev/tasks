---
title: "converge-has-one-has-many-mid-load-replacement-semantics"
status: ready
updated: 2026-07-21
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

PR #5038 changed the has_many mid-flight reassignment premise at the owner's
direction: rather than silently picking a winner when a target is replaced
while its load is in flight, `Association#setTarget` now raises
`AssociationTargetReplacedDuringLoad` (`packages/activerecord/src/errors.ts`).
The guard is `Association#_loaderWritebackSuppressed`, incremented around
`HasManyAssociation#doAsyncFindTarget` so a loader's own writeback can never
trip it.

`fix-has-one-mid-flight-reassignment-clobber` (#5035) solved the singular case
earlier with a different mechanism — a load-generation token
(`Association#_targetGeneration`) that lets the assignment win silently. The
two macros now disagree about what a mid-load replacement means: has_many
raises, has_one silently discards the load.

That divergence is the work. Rails has no opinion either way — `find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248`)
is synchronous, so neither macro can reach the state there; both behaviours
are trails-only inventions and they should at least be the _same_ invention.

Measured on #5038: raising broke zero Rails-ported tests for has_many (2001
passing in `associations/` + `associations.test.ts`). The equivalent
measurement for has_one has NOT been done — singular holders have different
mutation patterns (see `project_has_one_stale_state_nil_shapes_async_guards`),
so confirm before assuming it transfers.

## Acceptance criteria

- has_one and has_many agree on mid-load replacement semantics.
- If converging on the raise: `_targetGeneration` and its
  `_reclaimedTarget` / `_writeBackLoadedTarget` machinery from #5035 are
  deleted, not left alongside the new guard.
- Zero Rails-ported test regressions, verified on PostgreSQL and MySQL (SQLite
  timing hides both the bug and bad fixes).
- Whichever semantics wins is documented once, on the error class or the
  guard, with the Rails-parity rationale.
