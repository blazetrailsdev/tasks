---
title: "Audit + remove dead autosave dispatch chain (autosaveHabtm, autosaveAssociation(s), autosaveChildren/BelongsTo)"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4074
claim: "2026-06-24T18:02:43Z"
assignee: "autosave-dead-dispatch-habtm-audit"
blocked-by: null
---

## Context

In `packages/activerecord/src/autosave-association.ts` the live collection
autosave path is the registered `after_create`/`after_update` callback ->
`saveCollectionAssociation` -> `autosaveHasMany` (saveCollectionAssociation
hardcodes `type: "hasMany"` for ALL collections, including HABTM). That leaves a
parallel dispatch chain apparently dead:

- `autosaveAssociation` (the `if type === "hasMany"/"hasAndBelongsToMany"`
  dispatcher), `autosaveAssociations`, `autosaveChildren`, `autosaveBelongsTo`
  exports are not imported anywhere outside this file and are not used by tests.
- `autosaveHabtm` is reached only via `autosaveAssociation` (the dead
  dispatcher), so HABTM marked-for-destruction children actually converge
  through `autosaveHasMany` at runtime, never `autosaveHabtm`.

PR #4068 updated both `autosaveHasMany` and `autosaveHabtm` for consistency, but
`autosaveHabtm` and the dispatchers may be removable dead code.

## Acceptance criteria

- Audit-verify the runtime reachability of `autosaveAssociation(s)`,
  `autosaveChildren`, `autosaveBelongsTo`, and `autosaveHabtm` (grep callers +
  trace the save lifecycle).
- Either remove the confirmed-dead functions, or wire HABTM through its own
  `autosaveHabtm` path if Rails fidelity requires distinct HABTM handling
  (`hasAndBelongsToMany` reflections routing through a hasMany-typed def is the
  current shortcut).
- No behavior change for live save paths; no test:compare/api:compare
  regression.
