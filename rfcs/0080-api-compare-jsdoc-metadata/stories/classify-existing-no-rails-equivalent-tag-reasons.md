---
title: "Classify the 74 unclassified @noRailsEquivalent tag reasons"
status: done
updated: 2026-07-30
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 5652
claim: "2026-07-30T17:59:17Z"
assignee: "classify-existing-no-rails-equivalent-tag-reasons"
blocked-by: null
closed-reason: null
---

## Context

PR #5648 (RFC 0080) landed `classifyReason` in
`scripts/api-compare/extra-surface.ts`: a `@noRailsEquivalent` reason opening
with `PERMANENT` or `CONVERGEABLE` states its permanence claim, and
`parity:api:extra` reports the rest as `unclassified` (`tagged.classification` in the
JSON report, plus a per-package breakdown and the names in the human report).

The signal is advisory by design — on the tree at merge it reads **2
PERMANENT, 0 CONVERGEABLE, 74 unclassified**. Those 74 are not new debt: they
predate the convention. Until they carry a claim, the report cannot separate a
genuine JS-protocol extra from deferred porting, which is exactly the
distinction the 2026-07-27 tag audit had to make by hand
(`rfcs/0080-api-compare-jsdoc-metadata/tag-audit.md`: 42 of 79 tags described
convergeable surface).

The audit already recorded a disposition for most of these tags, so this is
transcription against that record plus a re-read where the audit is silent —
not a fresh audit. Expect several packages' worth; split by package if it
exceeds the 500-LOC ceiling (file each split from main, non-overlapping
files).

## Acceptance criteria

- Every `@noRailsEquivalent` reason under `packages/*/src` opens with
  `PERMANENT` or `CONVERGEABLE`.
- A `CONVERGEABLE` reason names the registered story that removes the tag; if
  none exists, register it (`pnpm tasks new`) and cite it.
- Each `PERMANENT` claim is stated against a `vendor/rails` `file:line`, per
  the audit's verification standard — not against the tag's own prose.
- `pnpm parity:api:extra` reports `tagged.classification.unclassified` as 0.
- No change to the exit-code contract; this story only edits reason prose.
