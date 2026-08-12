---
title: "Scope the parity:api per-file detail table to the AR closure artifact"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6362
claim: "2026-08-11T14:26:06Z"
assignee: "arel-tosql-statement-visitor-helper-calls"
blocked-by: null
closed-reason: null
---

## Context

PR #6347 added `scripts/api-compare/ar-closure.ts`, which derives the AR/AM
require closure from `vendor/rails/{activerecord,activemodel}/lib` and writes
`scripts/api-compare/output/ar-closure.json` (activesupport 143 files, i18n 5,
date 1). Today it feeds exactly one consumer: the `AR closure` rollup line in
`compare.ts:3377`.

The two open burndown stories under this RFC —
`activesupport-out-of-closure-unported-entries` and
`activesupport-closure-skip-groups-triage` — both need the same question
answered per file ("is this file in the data layer's closure?") and would
otherwise re-derive it by hand or by a second hard-coded list, which is the
duplication the artifact exists to prevent.

## Converged shape

Expose the closure as a per-file filter on the existing report — e.g.
`pnpm parity:api --package activesupport --closure` restricts the per-file table
(and its totals line) to `ar-closure.json`'s file set — so a burndown agent can
see exactly the in-scope misses instead of scrolling 699 out-of-scope members.
No new artifact and no new denominator: the whole-package summaries stay exactly
as they are.

## Acceptance criteria

- [ ] A flag on `parity:api` scopes the per-file detail table to the closure.
- [ ] Whole-package and Data-layer numbers are unchanged with and without it.
- [ ] Both open activesupport burndown stories can cite the flag rather than
      re-deriving the file list.
