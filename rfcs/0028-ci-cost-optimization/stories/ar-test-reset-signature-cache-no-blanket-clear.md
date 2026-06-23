---
title: "dropAllTables: reconcile signature cache instead of blanket clear (Path C)"
status: ready
updated: 2026-06-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From the `ar-test-reset-drop-table-churn` spike (PR #3953, audit at
`docs/infrastructure/ar-test-reset-drop-table-churn-audit.md`, Path C/D).

`dropAllTables` (`packages/activerecord/src/test-helpers/drop-all-tables.ts:14`)
calls `clearAppliedSchemaSignatures(adapter)` — a full wipe of the defineSchema
signature cache. This forces the NEXT file's `defineSchema` down the
signature-mismatch drop path (`define-schema.ts:698`), re-dropping+recreating
tables that did not actually change shape. That is the Path-C long tail in the
audit's per-path breakdown.

## Acceptance criteria

- Make `dropAllTables` reconcile the signature cache against the set of tables
  it actually dropped (delete only those entries) instead of wiping the whole
  cache via `clearAppliedSchemaSignatures`.
- Next-file `defineSchema` keeps cache hits for untouched tables (no Path-C
  re-drop), measured via the DDL_PROFILE path tag added by
  `ar-test-reset-shape-stable-impl`.
- Files: `drop-all-tables.ts`, `define-schema.ts`.
- Depends on `ar-test-reset-shape-stable-impl` landing the path-tag measurement
  first to size the win.
