---
title: "Gate the AR adapter jobs behind build-and-typecheck to cut cancelled-run waste"
status: draft
updated: 2026-06-14
rfc: "0000-ci-cost-optimization"
cluster: change-gating
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR concurrency is configured correctly — `cancel-in-progress` is ON for
`pull_request` (the `concurrency:` block at the top of `ci.yml`). But the three
AR adapter jobs (`sqlite-tests`, `postgres-tests`, `maria-tests`) gate only on
`needs: changes` and start **immediately**, then run 6–10 minutes each. A rapid
re-push (common with the agent fleet) cancels the superseded run **mid-AR-job**,
after it has already burned several minutes.

Measured: across the 60-run sample, **cancelled runs consumed 607 of 1,781
billed job-min (34%)**, and the conclusion mix over the last 200 runs is
**43.5% cancelled**. AR is ~50% of a run's minutes, so a large share of that
607 is AR jobs killed partway.

Adding `needs: [changes, build-and-typecheck]` to the AR jobs means they don't
start until the ~76 s build/typecheck passes. A re-push during that window
cancels them at **0 AR minutes burned** instead of ~3–5.

## Acceptance criteria

- [ ] `sqlite-tests`, `postgres-tests`, and `maria-tests` gain
      `build-and-typecheck` in their `needs:` list (keeping `changes`), with
      their `if:` conditions unchanged.
- [ ] The aggregate `ci` job's skip-allowlist logic still treats these jobs
      correctly when `build-and-typecheck` is skipped on docs-only runs (verify
      the `needs` chain doesn't turn a legitimate docs-only skip into an
      "unexpectedly skipped" failure).
- [ ] CI green on: a normal AR PR, a docs-only PR, and a push to `main`.

## Savings & risk

- **Est. savings:** ~2–3.5 billed job-min/run **amortized** (saves ~5–8 AR
  job-min on each cancelled run; at the measured ~43% cancel rate that is the
  highest-yield waste-reduction lever after adapter sampling).
- **Cost-vs-latency tradeoff (call-out):** on the **happy path** (no
  cancellation) this adds the build/typecheck wall-clock (~1.3 min) to the AR
  jobs' start, regressing time-to-green for AR PRs by that amount. Break-even:
  worth it as long as `cancel_rate × avg_AR_burned_before_cancel >
(1 − cancel_rate) × added_latency_minutes_that_matter`. At 43% cancel and
  ~5 min burned, the cost side dominates the latency side. If cancel rate drops
  substantially, revisit.
- **Risk:** medium. The hazard is the `ci` aggregate-gate interaction with the
  new `needs` edge on docs-only/skip paths — exercise all three event shapes.

## Notes

This composes with `cache-build-dist-across-jobs`: once `dist` is cached, the
AR jobs that now wait for build can also **reuse** its output, so the added
latency is partly recovered (they skip their own `pnpm build`).
