---
title: "Cache the workspace build output so jobs stop re-running pnpm build"
status: draft
updated: 2026-06-14
rfc: "0000-ci-cost-optimization"
cluster: caching-install
deps:
  - route-all-jobs-through-setup-pnpm-composite
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`pnpm build` (the full `tsc --build` workspace compile) runs in **six** jobs on
every full run: `build-and-typecheck`, `guides-typecheck`, `sqlite-tests`,
`postgres-tests`, `maria-tests`, and `rails-comparison` — plus two partial
per-package builds in `schema-parity-trails` and `query-parity-trails`. The
build artifact is produced once in `build-and-typecheck` and then thrown away;
every other job recompiles from scratch.

Restoring a prebuilt `dist/` instead of recompiling cuts that redundant work.
The constraint: the AR jobs gate on `needs: changes` only and run **in
parallel** with `build-and-typecheck` for latency, so we must **not** add a
`needs: build-and-typecheck` dependency edge (that would serialize and regress
time-to-green). Use `actions/cache` keyed on a source-tree hash instead, so
each job restores the cache populated by whichever job built first.

## Acceptance criteria

- [ ] Add an `actions/cache@v4` step (after install, before any `pnpm build`)
      that caches the per-package `dist/` directories (e.g.
      `packages/*/dist`), keyed on
      `build-v1-${{ runner.os }}-${{ hashFiles('packages/**/src/**', 'tsconfig*.json', 'pnpm-lock.yaml') }}`.
- [ ] On cache hit, skip `pnpm build` (guard the build step on the cache-miss
      output, or make `pnpm build` a no-op when `dist` is current — confirm
      `tsc --build` incrementally no-ops on a warm `dist` + `.tsbuildinfo`).
- [ ] Cache `.tsbuildinfo` alongside `dist` so `tsc --build` short-circuits.
- [ ] No `needs:` edges added between AR/test jobs and `build-and-typecheck`
      (parallelism preserved).
- [ ] CI green on a push to `main`; verify the build step is skipped/instant on
      the jobs that hit the cache.

## Savings & risk

- **Expected wall-time impact: MOVER.** `pnpm build` (~30–45 s) sits inside the
  AR adapter jobs, which are the critical-path long pole — removing it shortens
  end-to-end time-to-green, not just billed minutes.
- **Est. savings:** ~1–3 billed job-min/run (build is ~30–45 s; removing it from
  ~5 jobs crosses a minute boundary on 1–3 of them per run) **plus** meaningful
  wall-clock on the AR critical path.
- **Risk:** medium. Cache-correctness is the hazard — a stale `dist` restored
  onto changed source would mask failures. Mitigated by keying on a content hash
  of `src/` + tsconfigs + lockfile (exact-match, no `restore-keys`), so any
  source change misses the cache and rebuilds. Verify `tsc --build` treats a
  restored `.tsbuildinfo` as authoritative.

## Measurement & go/no-go

Merge only on a measured wall-time win; otherwise close the PR (see the RFC's
"Measurement protocol").

- [ ] Baseline (over ≥5 AR-affecting runs on `main`): median time-to-green and
      the median wall-clock of the SQLite/PostgreSQL/MariaDB jobs (the cache
      consumers).
- [ ] Re-measure the same on this branch (≥5 runs), confirming a cache **hit**
      (the `pnpm build` step skipped/instant) on each consumer job.
- [ ] **Go:** the targeted AR jobs' wall-clock and/or median time-to-green drop
      by ≥10% or ≥15 s (whichever larger). **No-go:** within noise → close the
      PR, record the table, mark the story `blocked`.
- [ ] PR description includes the before/after table (time-to-green, per-AR-job
      wall-clock, billed minutes; run count + dates).

## Notes

Depends on `route-all-jobs-through-setup-pnpm-composite` so the cache step lands
in one consistent setup path rather than ~8 hand-inlined ones. If `tsc --build`
incrementality proves unreliable across a restored cache, fall back to the
`actions/upload-artifact` → `download-artifact` pattern already used by the
parity jobs (accepting that artifact transfer has its own per-job cost).
