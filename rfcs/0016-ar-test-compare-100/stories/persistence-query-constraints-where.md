---
title: "Route update/delete/destroy WHERE through _query_constraints_hash"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up surfaced by #3244 (locking-dirty-primary-key). That PR fixed the
update/delete/destroy WHERE clauses to target `id_in_database` instead of the
in-memory primary key, but did so by calling `_buildPkWhereNode(idInDatabase())`
directly at three sites:

- `base.ts` `_performUpdate` (~2989)
- `base.ts` `_destroyRow` (~3055)
- `persistence.ts` `deleteRow` (~622)

These bypass the `_queryConstraintsHash` helper (persistence.ts) that handles
`queryConstraintsList`. Rails' `Persistence#_query_constraints_hash`
(persistence.rb:852-854) returns `{ @primary_key => id_in_database }` only when
`query_constraints_list` is nil; otherwise it maps each constraint column to its
`attribute_in_database`. So a model declaring `query_constraints` (distinct from
a composite primary key) currently gets a PK-only WHERE in these three paths.

This is a pre-existing gap (the original `this.id` had it too) — #3244 did not
regress anything — but the divergence from Rails remains.

## Acceptance criteria

- Update/delete/destroy WHERE construction for models with a non-nil
  `queryConstraintsList` matches Rails `_query_constraints_hash` (constraint
  columns keyed to their `attribute_in_database` values), while the simple
  single-PK and composite-PK cases stay byte-for-byte unchanged.
- Add a Rails-named test covering a `query_constraints` model's
  update/delete/destroy WHERE (port the corresponding Rails case verbatim).
- No regression in `locking` / `persistence` / `primary-keys` suites.
