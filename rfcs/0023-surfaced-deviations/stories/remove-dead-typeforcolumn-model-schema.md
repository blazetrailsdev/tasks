---
title: "Remove unused typeForColumn helper in model-schema.ts"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-convergence item: deleting an unreferenced module-private helper (model-schema.ts:1591) changes no behaviour and no measured surface (it is not exported, so parity:api:extra never scores it). Pure cleanup, not port fidelity."
---

## Context

While extracting `reflectedTypeForColumn` in PR #4748, found a pre-existing
dead helper `typeForColumn(this, connection, column)` in
`packages/activerecord/src/model-schema.ts` (~line 1603) with no callers in the
repo (a separate `typeForColumn` lives in `attributes.ts:323`). It does a bare
`connection.lookupCastTypeFromColumn(column)` and is unreferenced.

## Acceptance criteria

- Confirm no dynamic/string references, then delete the unused
  `typeForColumn` in `model-schema.ts`.
- No behavior change; type-check + lint clean.
