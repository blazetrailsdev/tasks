---
title: "api:build --emit-baselines/--check: derive exclude JSON from @missingRailsCall tags"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 62
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`docs/infrastructure/api-build-stub-generation-plan.md` (PR #5229) recommends option 3: `@missingRailsCall` JSDoc becomes authoritative and the exclude JSON baselines become generated artifacts. Implement `api:build --emit-baselines` (walk tags, write `call-mismatches-wide-exclude/` + `call-mismatches-exclude.json` in the existing `ExcludeEntry` schema and `compareKeys` order — reuse `writeSplitBaseline` in `scripts/api-compare/lint-call-mismatches-wide.ts:142` and `compareKeys`/`keyOf` from `lint-call-mismatches.ts:184,130`) plus `--check` (fail on committed-vs-derived drift, same pattern as `conventions-doc.ts --check`). Narrow-row routing: emit a narrow row iff the call is in `SIGNIFICANT_CALLS` (compare.ts:103) and `narrowCallsApplies` (compare.ts:258) passes. Per the doc's interim rule, only emit for files carrying at least one tag, so cutover stays per-file.

## Acceptance criteria

- `--emit-baselines` regenerates byte-identical baselines for migrated files; untouched files' JSON unchanged.
- `--check` exits non-zero on drift; wired into CI for migrated packages.
- `@internal`/private members' tags are skipped (gates are full-surface only).
