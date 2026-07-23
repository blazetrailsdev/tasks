---
title: "Align CI AR_DB_FORKS with the clamped host ceiling (8 was never real)"
status: claimed
updated: 2026-07-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 15
pr: null
claim: "2026-07-23T22:07:11Z"
assignee: "align-ci-ar-db-forks-with-clamped-reality"
blocked-by: null
closed-reason: null
---

## Context

PR #5104 revealed that CI's `AR_DB_FORKS=8` (postgres-tests, mysql-tests,
maria-tests in .github/workflows) has never actually been the run concurrency:
the per-project `maxForks` was a vitest-3 no-op, so every CI run used vitest's
`numCpus - 1` fallback (3 on the 4-vCPU runner). #5104 now clamps
`TEST_FORKS = min(env, numCpus - 1)` in `vitest.config.ts:82-94`, so the
workflow's `8` is dead weight: it only inflates the advisory-slot pool to 10
slot DBs (`packages/activerecord/src/test-helpers/ar-db-slots.ts:48-53`
derives slots from AR_DB_FORKS + 2) — 6-7 of which are provisioned but never
claimable. The header comment in `vitest.config.ts:4-28` also still claims
"the live AR DB jobs all set AR_DB_FORKS=8" as the effective worker count and
cites the tune-ar-db-forks-to-runner-cores sweep, whose forks=8-vs-4
comparison was actually measuring the clamped fallback both times.

## Acceptance criteria

- [ ] Set AR_DB_FORKS in the three AR DB workflow jobs to the concurrency CI
      actually runs (numCpus - 1 = 3 on the current 4-vCPU runner), or remove
      it and let the default apply — either way the value must match reality.
- [ ] Slot-DB provisioning count drops accordingly (fewer dead CREATE
      DATABASEs per job).
- [ ] Refresh the stale vitest.config.ts header paragraphs that describe 8
      forks as the live CI worker count.
