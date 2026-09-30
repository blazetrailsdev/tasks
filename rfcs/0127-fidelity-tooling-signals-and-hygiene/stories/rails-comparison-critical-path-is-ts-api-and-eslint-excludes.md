---
title: "Shorten the rails-comparison critical path (ts-api → API comparison; eslint-excludes → method-order) now that Ruby extraction is cached"
status: draft
updated: 2026-09-30
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8294 cached the `rails-comparison` Ruby extraction outputs (`ruby-api` and `ruby-tests` in `scripts/ci/bg-gates.mjs`). On a hit the cache saves 55–66 CPU-seconds, but the job's wall time did not drop. In that PR's own runs, hits took 161s and 165s, and misses took 134–141s.

The `Background gate timings` summary for a hit run (job 110054978322) shows where the critical path now lies:

- `ts-api` (`scripts/api-compare/extract-ts-api.ts`) takes 52.5s. The `API comparison` step (`.github/workflows/ci.yml`, `wait ts-api && compare.ts`) then runs in the foreground, followed by every call/arg/extra ratchet step after it.
- `eslint-excludes` takes 34.1s. `method-order` (35.8s) and `test-names` are both `after eslint-excludes`, so this chain is about 70s.
- `test-compare` starts at 89.5s even though `ruby-tests` finished at 0s, because it waits for a free slot (CI_BG_JOBS = cores − 1).

The Ruby extraction used to run in the shadow of these chains, so removing it freed cores but did not shorten the path.

## Acceptance criteria

- Measure the critical path of `rails-comparison` from the `bg-gates.mjs summary` table, together with the foreground step timings, on a cache-hit run.
- Shorten the dominant chain. Candidates:
  - cache `ts-api.json`, keyed on the TS sources it reads, with an exact key like the Ruby cache's;
  - cache the `eslint-excludes` generator outputs, keyed on their inputs;
  - reorder the `bg-gates` spec so the chain heads start first.
- The PR body reports before/after job wall time from its own CI runs, and names the new critical path.
