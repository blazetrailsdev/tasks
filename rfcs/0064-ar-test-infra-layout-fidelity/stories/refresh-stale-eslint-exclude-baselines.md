---
title: "refresh the two stale ESLint exclude baselines and guard against drift"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
pr: 6114
claim: "2026-08-05T02:30:05Z"
assignee: "refresh-stale-eslint-exclude-baselines"
blocked-by: null
closed-reason: null
---

## Context

Both committed ESLint exclude baselines are stale on `main`: a fresh
regeneration produces materially less than what is committed, which means each
rule is grandfathering sites that no longer exist. A ratchet that has drifted
loose stops catching the thing it was installed to catch.

Observed while working PR #5723 (the generators were run to confirm a type-only
change had not altered their behavior — it had not; the drift predates it):

- `pnpm tsx scripts/generate-standalone-associations-exclude.ts` writes **120**
  grandfathered sites against a committed file of ~318 — a 198-line reduction.
  Sites have been converted to the in-class `this.<macro>(…)` form (RFC 0033's
  burndown) without the baseline being refreshed, exactly as
  `generate-standalone-associations-exclude.ts:9-10` anticipates ("As sites are
  converted … they drop out of this list").
- `pnpm fixture-baseline:refresh` drops **1** entry from
  `eslint/expected-fixtures-exclude.json`.

Neither was refreshed in #5723 — regenerating a committed baseline is not a
typecheck cleanup's business, and doing it there would have buried a ~200-line
generated-data diff inside an unrelated PR.

## Acceptance criteria

- Both baselines regenerated and committed, in a PR that does nothing else
  (generated data is exempt from the LOC ceiling, but it should not be mixed
  with logic changes).
- Confirm the reduction is genuine convergence, not a generator regression:
  spot-check a handful of the 198 dropped `no-standalone-associations` entries
  and verify each site really did convert to the in-class form, rather than
  the file moving or the scan silently skipping it (the generator swallows
  parse failures at `generate-standalone-associations-exclude.ts:78`).
- Consider a CI guard that fails when a committed baseline differs from a fresh
  regeneration, so neither can drift again — the same shape as the other
  manifest-freshness checks.

## Notes

Est. 40 LOC of hand-written change (the regenerated JSON is generated data).
Tooling only, no Rails counterpart.
