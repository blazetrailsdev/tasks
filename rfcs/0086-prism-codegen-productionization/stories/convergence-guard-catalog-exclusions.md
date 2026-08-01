---
title: "convergence-guard-catalog-exclusions"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 1
pr: 5789
claim: "2026-08-01T02:43:46Z"
assignee: "convergence-guard-catalog-exclusions"
blocked-by: null
closed-reason: null
---

## Context

`pnpm codegen:score` (PR #5727, `scripts/prism-codegen/score.ts`) classifies
clean generated defs as matched/divergent/missing vs the port; baseline
32/267/104 (10.7%). To become the RFC 0065 zero-deviation convergence guard
(spike doc item 7, docs/infrastructure/prism-codegen-spike.md), the
divergent/missing sets must be filtered by the existing deviation catalog:
`SKIP`/`SCOPED_SKIP` in `scripts/api-compare/conventions.ts` and the
api-compare exclude lists (`call-mismatches-exclude.json`,
`call-mismatches-wide-exclude.json`), plus a checked-in baseline file for
the residue, so that a NEWLY ported method that silently renames, inlines,
or drops a Rails method without a catalog entry trips a ratchet instead of
drowning in the 267-row baseline.

## Acceptance criteria

- Scorer subtracts catalogued exceptions (SKIP/SCOPED_SKIP/exclude lists)
  from divergent/missing before reporting.
- A checked-in baseline captures the current residue; a ratchet fails when
  new uncatalogued rows appear (and auto-shrinks are accepted).
- CI wiring documented (which job runs it and when), consistent with the
  scripts tsconfig + unit-tests gate pattern from #5727.
