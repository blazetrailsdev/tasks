---
title: "body-pins-manifest-locale-sort-churn"
status: done
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5195
claim: "2026-07-24T00:52:19Z"
assignee: "body-pins-manifest-locale-sort-churn"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/body-pins.ts:155` sorts the committed body-pins manifest
with `keyOf(a).localeCompare(keyOf(b))` before `fs.writeFile` at line 214 —
the same locale/ICU-dependent comparator that made the wide call-mismatch
baseline reorder untouched packages on every reseed (fixed in
`wide-calls-exclude-reseed-reorders-untouched-packages`, PR #5183).

ICU collation demotes punctuation to a secondary difference, so pin keys that
differ only in `!` / `_` / `?` sort differently depending on the runner's
locale and ICU version. Any regeneration of the manifest can therefore emit a
symmetric +/- diff with no content change.

`compareKeys` (exported from `scripts/api-compare/lint-call-mismatches.ts`
since #5183) is the documented code-unit total order to reuse — body-pins has
its own `keyOf`, so it needs an equivalent local comparator rather than a
direct import.

Same class of issue also exists in `extra-surface.ts` (lines 657/681/838) —
check whether those sorts feed committed artifacts before deciding scope.

## Acceptance criteria

- Body-pins manifest emission uses a documented, locale-independent code-unit
  sort key.
- Any one-time reordering of the committed manifest lands as its own commit,
  content-preserving (identical entry multiset, entry count unchanged).
- Regenerating the manifest twice with no source changes produces
  byte-identical files, verified by diffing committed bytes.
- The body-pins gate stays green across the reorder.
