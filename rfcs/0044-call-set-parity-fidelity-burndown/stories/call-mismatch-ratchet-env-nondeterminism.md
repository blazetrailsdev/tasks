---
title: "Call-mismatches ratchet is environment-non-deterministic (local vs CI diverge)"
status: claimed
updated: 2026-06-24
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-24T17:02:44Z"
assignee: "call-mismatch-ratchet-env-nondeterminism"
blocked-by: null
---

## Context

The RFC 0044 call-mismatches ratchet (`scripts/api-compare/lint-call-mismatches.ts`,
baseline `scripts/api-compare/call-mismatches-exclude.json`) is
**environment-non-deterministic**: a local `pnpm api:compare` run and the CI
"Rails API/Test Comparison" job compute DIFFERENT call-mismatch sets for the same
commit. Surfaced 2026-06-23 while fixing a red main (PR #4020):

- On main HEAD, two independent local runs both reported **12 STALE** baseline
  entries (entries the gate no longer flags), all in the web layer:
  abstractcontroller/callbacks, actioncontroller/{base,test-case},
  actiondispatch/middleware/static, activesupport/{current-attributes,
  hash-with-indifferent-access}, rack/{headers,mock-request},
  trailties/{application,source-annotation-extractor}.
- CI on the same baseline reported those same entries as **flagging** (NEW when a
  local `--write` reseed removed them): CI sees 13 mismatches, local sees ~1.
- Candidate strings also differ (local `find_in/update` vs CI `find_in update`).

So `--write` reseed from a local artifact silently DROPS entries that CI still
flags, turning a green-locally baseline into a red-in-CI one (exactly what
happened on the first iteration of PR #4020). The gate is therefore
un-verifiable locally and desyncs on every merge-train push.

Likely causes to investigate:

- Vendored Rails version skew: `pnpm vendor:fetch` resolves upstream Ruby
  sources from `vendor/sources.lock.json`; a stale local vendor cache vs CI's
  freshly-fetched sources changes the Ruby-side expected-call set (the 12 are all
  web-layer `update`/`run_callbacks` calls — sensitive to the vendored source).
- `output/ts-api-cache` staleness on the TS side.
- Non-deterministic ordering in the mismatch extraction.

## Acceptance criteria

- [ ] `pnpm api:compare` + `lint-call-mismatches.ts` produce the SAME
      call-mismatch set locally as the CI "Rails API/Test Comparison" job for a
      given commit (pin/refresh the vendored Rails so local matches CI; clear or
      key the ts-api cache; make extraction order deterministic).
- [ ] `--write` reseed is reproducible: running it locally yields a baseline CI
      accepts (0 NEW, 0 STALE), OR the workflow documents a canonical-only reseed
      path (e.g. run under the CI vendor lock / a make target) so contributors
      don't shrink the baseline against a skewed local artifact.
- [ ] Add a guard or doc note in `lint-call-mismatches.ts`'s header so the next
      person doesn't `--write` from a stale local env and red main.

## Notes

Do NOT widen/relax the ratchet to paper over this — the determinism is the bug.
Surfaced from PR #4020 (converge HashWithIndifferentAccess#initialize); the
merge-train skew that file exposed is the symptom.
