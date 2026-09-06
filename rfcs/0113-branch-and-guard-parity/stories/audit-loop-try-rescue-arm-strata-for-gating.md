---
title: "Audit the loop / try / rescue arm strata for gating"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`remeasure-arm-noise-floor-per-token` audited two strata of the RFC 0113 arm
report and `seed-a-missing-throw-arm-ratchet` (trails#7554) gated the one that
cleared. Three strata were explicitly left unmeasured. The audit
(`audits/arm-mismatch-noise-floor-20260906T022720Z.md`) says so in as many
words:

> **Not covered:** the `loop`, `try` and `rescue` strata. Each is under 200 rows
> in the missing direction and readable in full; whether any of them also clears
> the tripwire is a question for its own audit, not an extrapolation from these
> three.

Measured on trails#7554's merge commit, over 6,063 compared pairs:

```text
Missing arms by token:  if 531, loop 121, throw 65, try 69, rescue 61
```

So `loop` (121), `try` (69) and `rescue` (61) are 251 rows between them — each
readable in full, exactly as the `throw` stratum's 69 were.

The two extremes are already known and neither generalises: the whole
population is 75.0% non-real and `if` is 70.0% (and `if` IS the population, at
1,891 of the rows), while missing-`throw` came in at 11.6% non-real. Nothing in
either figure predicts where `loop` / `try` / `rescue` land, which is why the
audit refused to extrapolate.

The tooling to draw them already exists and needs no work — `--token=` shipped
in trails#7554:

```bash
pnpm parity:api --calls
pnpm tsx scripts/api-compare/report-arms.ts --report --direction=missing --token=loop
```

## Converged shape

Read each stratum in full — they are small enough that sampling is unnecessary
and a full read is the stronger evidence, as it was for `throw`. Classify each
row real / lowering artefact / extraction bug on the same three verdicts, using
the strict boundary the last audit made explicit (a delegation to a
**trails-invented** helper is REAL, per CLAUDE.md's Decomposition rule).

For any stratum whose non-real rate clears RFC 0113's pre-committed ⅓ tripwire,
gate it the way `throw` is gated — `scripts/api-compare/arm-throw-mark.ts` and
`lint-arm-throws.ts` are the template, and the mark shape (per-package total
plus per-TS-file counts, only-shrink, `tighten` and no reseed) carries over
unchanged. Suppress lowering artefacts at the source first, as the halt-helper
fold did, so the seeded mark is not padded with known-false rows.

A stratum that does NOT clear stays report-only, and the figure is recorded in
`docs/infrastructure/arm-mismatch-noise-floor.md` beside the other three so the
next reader does not re-derive it.

## Acceptance criteria

- [ ] `loop`, `try` and `rescue` missing-direction strata each read in full and
      classified, with the per-row verdict table delivered as an audit report.
- [ ] Each stratum's non-real rate and 95% interval recorded in
      `docs/infrastructure/arm-mismatch-noise-floor.md`.
- [ ] Any stratum clearing the ⅓ tripwire is gated on the `arm-throw-mark.ts`
      pattern, only-shrink, seeded from the CURRENT measurement.
- [ ] Any stratum that does not clear stays report-only, with the figure
      recorded rather than left implicit.
