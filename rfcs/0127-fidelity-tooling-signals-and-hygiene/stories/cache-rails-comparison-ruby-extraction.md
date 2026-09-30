---
title: "Cache the rails-comparison Ruby extraction outputs keyed on vendored refs + extractor hashes"
status: draft
updated: 2026-09-30
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `rails-comparison` job ("Rails API/Test Comparison", `.github/workflows/ci.yml`) re-runs both Ruby extractors on every run:

- `ruby-api`: `scripts/api-compare/extract-ruby-api.rb`, which writes `scripts/api-compare/output/rails-api.json`
- `ruby-tests`: `scripts/test-compare/extract-ruby-tests.rb`, which writes `scripts/test-compare/output/rails-tests.json`

Their inputs only change when the vendored sources (`vendor/sources.lock.json`) or the extractor scripts change. The job already caches the vendored clones (`vendor-sources-${{ hashFiles(...) }}`) but not the extraction outputs. A local cross-worktree cache for `rails-api.json` already exists (`scripts/api-compare/orchestrate.ts` `runRubyExtractShared` / `railsCacheKey`); CI does not use it.

Measurements as of 2026-09-30, last 37 successful runs: job mean 260s, median 274s, range 190–307s. Average step durations (last 10 runs): Extract Ruby tests 21.2s, Extract Ruby API 9.8s, API comparison 30.6s, ESLint exclude baselines 24.6s, Rails-private JSDoc lint 23.1s, Dependency lint 16.7s, test-name ratchet 12.1s, method-order lint 12.0s, detached JSDoc gate 11.5s.

trails#8289 moved every gate off the API chain onto the runner's spare cores (`scripts/ci/bg-gates.mjs`). The gate phase is now CPU-bound: about 200 CPU-seconds over 3 background slots. So the ~31 CPU-seconds of Ruby extraction translate directly into wall time. `ruby-api` is also the head of the privates-manifest → ESLint chain.

## Acceptance criteria

- An `actions/cache` step restores `rails-api.json` and `rails-tests.json`. It is keyed on `vendor/sources.lock.json`, `vendor/sources.ts`, both extractor `.rb` files, and every Ruby file they `require`/`require_relative`, plus the `vendor:fetch --print-*` output (lib paths, entry files, test paths).
- On a hit, the `ruby-api` / `ruby-tests` bg-gates tasks are no-ops. On a miss they extract as today.
- Exact-key match only, with no `restore-keys`: a stale extraction must never gate a PR.
- A PR that edits an extractor or bumps a vendored ref misses the cache. Show this in the PR with one run of each.
- The PR body reports before/after job timings from its own CI run.
