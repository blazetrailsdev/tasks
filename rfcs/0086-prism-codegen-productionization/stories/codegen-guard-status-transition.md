---
title: "Report baseline status transitions distinctly from new divergences in the codegen convergence guard"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

PR #5799 fixed a red `Rails API/Test Comparison` caused by
`scripts/prism-codegen/convergence-baseline.json` being seeded in #5789 from a
branch point that predated #5791 (accessor/const-arrow resolution in the
scorer). Five rows seeded as `::missing` resolved to `::divergent` once both
landed on main, and the guard reported them as:

```text
prism-codegen convergence guard: 5 uncatalogued divergence(s) not in the baseline.
```

That message is misleading. The rows were not new — the same
`file::name` pair was already in the baseline under a different status. The
guard keys its baseline on `file::name::status`, so a status transition reads
as a brand-new divergence, and the recommended remedy ("Converge the port, or
catalog the deviation") points at work that does not exist. Diagnosing it
required a counterfactual run with the accessor branch deleted from
`score.ts`.

Relevant code: `scripts/prism-codegen/guard.ts` (baseline diffing),
`scripts/prism-codegen/score.ts:320` `resolvePortFn` (the resolver whose
improvement caused the skew), `scripts/prism-codegen/convergence-baseline.json`.

## Acceptance criteria

- The guard distinguishes a row whose `file::name` is present in the baseline
  under a different `status` from a row absent entirely, and reports it as a
  status transition (e.g. `missing -> divergent`) rather than an uncatalogued
  divergence.
- A pure status transition names re-seeding as the remedy; a genuinely new
  `file::name` keeps the current "converge or catalog" guidance.
- A transition toward convergence (`divergent -> matched`, or leaving the
  residue) keeps behaving as it does today — the baseline still only shrinks.
- Unit coverage in `scripts/prism-codegen/guard.test.ts` for each of: new row,
  status transition, converged row.

## Definition of done

Guard output disambiguates the two cases; `pnpm codegen:score --guard` stays
green on main; tests added.

## Verification

`pnpm vitest run scripts/prism-codegen` plus a `--guard` run on main.
