---
title: "Consolidate the tiny leaf test jobs into one affected-aware job"
status: draft
updated: 2026-06-14
rfc: "0000-ci-cost-optimization"
cluster: parallelism-rounding
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Several leaf test jobs each finish in well under a minute but bill a full minute
apiece: `rack-tests` (27 s), `actionview-tests` (26 s), `tse-compiler-tests`
(22 s), `dx-type-tests` (30 s), and `trailties-tests` (42 s) / `actionpack-tests`
(50 s) hover near the boundary. On a full run that is ~5–6 billed minutes for
~3 minutes of compute.

Each currently has its own change-gate so that, e.g., a rack-only PR runs only
rack tests. We can keep most of that benefit while killing the rounding tax by
collapsing the cheapest leaf jobs into **one** `leaf-tests` job that internally
runs only the packages whose affected-flag is true (passed in from `changes`),
emitting one billed minute instead of up to five.

This trades a little **scheduling granularity** (the consolidated job runs
slightly longer wall-clock when several leaves are affected, and a single
flaky leaf re-runs its co-tenants) for rounding savings. It does **not** reduce
coverage — every affected package's tests still run.

## Acceptance criteria

- [ ] Create a `leaf-tests` job that receives the relevant `changes` affected
      flags and runs `pnpm vitest run` over exactly the affected leaf packages
      among: rack, actionview, tse-compiler, and the DX type tests (choose the
      set whose individual wall-clocks are safely sub-minute; leave
      actionpack/trailties standalone if their ~50 s risks pushing the combined
      job over 2 min — document the chosen split).
- [ ] The job runs if **any** of its member flags is true; each package step is
      individually `if:`-gated on its flag so unaffected packages are skipped
      inside the job.
- [ ] Remove the absorbed standalone jobs; update the aggregate `ci` job's
      `needs:` list and skip-allowlist (the per-job skip cases collapse into the
      `leaf-tests` case, which is a legitimate skip only when **all** member
      flags are false).
- [ ] CI green on: a rack-only PR (only rack step runs), a multi-leaf PR, and a
      push to `main` (all member steps run).

## Savings & risk

- **Est. savings:** ~3–4 billed job-min per full run; ~1–2 on typical
  single-leaf PRs.
- **Risk:** medium. Not a coverage cut, but it reduces gating granularity and
  couples leaf flakiness (a flaky rack test now re-runs actionview/tse with it).
  Keep notoriously-flaky packages out of the merged job. Verify the combined
  job stays under ~2 billed minutes or the rounding win shrinks.

## Notes

This is the inverse tradeoff to per-package gating (RFC history split these jobs
apart for granularity); the cost data now favors recombining the _cheapest_
ones. Do not merge the AR jobs here — they are large and service-bound and
belong to the coverage/runner stories.
