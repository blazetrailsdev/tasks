---
title: "Report @missingRailsArgs / @missingRailsCall suppressions grouped by permanence claim"
status: claimed
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-21T19:20:36Z"
assignee: "converge-enumerable-min-receiver-call-shape"
blocked-by: null
closed-reason: null
---

## Context

PR #6827 added the `@missingRailsArgs <ruby_call> — <reason>` call-site receipt
for the call-ARGUMENT gate (`scripts/api-compare/missing-rails-args-tags.ts`).
The tag's reason must open with `PERMANENT` or `CONVERGEABLE` — the discipline
`parity:api:extra` enforces on `@noRailsEquivalent` — and an unclassified reason
throws. What is missing is the REPORT half: `extra-surface.ts` counts its tags
by permanence and prints "permanence claims: N PERMANENT, M CONVERGEABLE"
(extra-surface.ts:1731-1740), so the convertible slice of that debt is visible.
Nothing equivalent exists for the args tags — `parity:api:calls:args:report`
does not know about them, so a CONVERGEABLE tag is as invisible as a PERMANENT
one and never surfaces as work.

The same gap applies to `@missingRailsCall`, which has no permanence token at
all: `missing-rails-call-tags.ts` gates only the empty-reason contract.

## Converged shape

`pnpm parity:api:calls:args:report` (and the call-set equivalent) group the
tagged suppressions by permanence claim and print the counts beside the
baseline row counts, so PERMANENT and CONVERGEABLE receipts are separable
populations and the CONVERGEABLE ones can be burned down. `classifyReason` is
already shared (`missing-rails-call-tags.ts`); the artifact needs to carry each
suppression's reason for the report to read.
