---
title: "Remove unused typeForColumn helper in model-schema.ts"
status: ready
updated: 2026-07-07
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
closed-reason: null
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
