---
title: "Burn the AR test no-explicit-any allowlist to zero (epic)"
status: ready
updated: 2026-06-18
rfc: "0037-no-explicit-any-enforcement"
cluster: null
deps:
  - mechanism-error-plus-allowlist
  - strip-asany-codemod
deps-rfc: []
est-loc: 200
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Epic/tracking story for burning the `**/*.test.ts` allowlist (from the
`mechanism` story) to zero using the `codemod` tool plus hand-fixes. 2,803
`as any` across 369 files; 186 already clean. Concentrated: top-15 files hold
~1,500. Residue the codemod can't auto-fix: `_private` reaches (434 — narrow
to `as { _x: T }` or a typed test accessor), `association("x") as any` (type
the `association()` helper return — one fix clears many callsites),
under-declared models (overlaps `0019/materialize-declares-strip-asany`).

## Acceptance criteria

- Tracking story: child PRs each clean a file/cluster, drop those entries from
  the test allowlist, and stay under 500 LOC. Do NOT fan out PRs from this
  story — register child stories as the work is scoped.
- Order: long-tail (low-count) files first, then the top-15.
- Done when the `**/*.test.ts` allowlist is empty — at which point the rule is
  already `error` for all AR test files (no separate flip).
- Coordinate model-`declare` work with `0019/materialize-declares-strip-asany`
  to avoid overlap.
