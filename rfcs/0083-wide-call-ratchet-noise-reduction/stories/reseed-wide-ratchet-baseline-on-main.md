---
title: "Reseed the wide ratchet baseline on main so drift is attributed to the merge that caused it"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5874
claim: "2026-08-02T11:46:48Z"
assignee: "reseed-wide-ratchet-baseline-on-main"
blocked-by: null
closed-reason: null
---

## Context

PR #5869 added the slack arm that fails the wide gate when
`scripts/api-compare/call-mismatches-wide-unreviewed.json` sits above what a
clean reseed would write. It surfaces drift, but only on the NEXT feature PR to
touch CI: #5869 itself went red on 5 STALE rows in
`call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-statements.json`
(`quote_column_name` / `quote_table_name`) that a sibling merge had converged
without reseeding. The author paid for the diagnosis and carried an unrelated
baseline edit in a tooling PR.

Nothing reseeds on `main`. The gate is only wired into the per-PR
`Rails API/Test Comparison` job (`.github/workflows/ci.yml`), so a merge that
converges rows leaves `main` in a state where every subsequent branch inherits
the failure.

## Acceptance criteria

- A scheduled or post-merge job on `main` runs the wide reseed
  (`pnpm parity:api:calls:reseed`) and surfaces any resulting diff — either by
  opening a maintenance PR or by failing loudly with the row list.
- Drift is attributed to the merge that caused it, not to the next unrelated
  branch that happens to run the gate.
