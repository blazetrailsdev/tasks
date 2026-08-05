---
title: "conformance-triage-burndown"
status: done
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - convergence-guard-catalog-exclusions
  - scorer-getter-and-arrow-resolution
  - delegate-macro-receiver-resolution
deps-rfc: []
est-loc: 400
priority: 14
pr: 6120
claim: "2026-08-05T09:14:57Z"
assignee: "relocate-erb-util-ports-to-core-ext-tse-util"
blocked-by: null
closed-reason: null
---

## Context

The prism-codegen conformance scorer (PR #5727, pnpm codegen:score) reports
32 matched / 292 divergent / 79 missing over the 406 clean defs. A
stratified 33-def hand triage (docs/infrastructure/prism-codegen-spike.md)
split the divergent set ~48% port-deliberate restructure, ~21% tooling
artifacts, ~9% catalogued, ~21% candidate untracked deviations (three
already verified and filed under 0023-surfaced-deviations). This story is
the burndown vehicle the guard machinery
([[convergence-guard-catalog-exclusions]]) records results into: disposition
every divergent/missing row as matched, catalogued (with justification), or
filed as a deviation story. Work in batches (~40 rows per chunk) so each
batch is PR-sized; extrapolation predicts ~50-60 real deviations total.

## Acceptance criteria

- Every scorer row dispositioned: matched, catalogued entry with call-site
  justification, or a filed 0023 deviation story.
- The guard baseline shrinks to zero uncatalogued residue.
- Verified-deviation stories capture vendor/rails + port file:line context.
