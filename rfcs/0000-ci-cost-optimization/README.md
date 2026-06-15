---
rfc: "0000-ci-cost-optimization"
title: "CI cost optimization — cut billed Actions minutes and time-to-green"
status: draft
created: 2026-06-15
updated: 2026-06-15
owner: "@deanmarano"
packages: []
clusters:
  - caching-install
  - change-gating
  - parallelism-rounding
  - flake-cost
related-rfcs:
  - "0012-adapter-test-ci"
  - "0019-canonical-schema-burndown"
---

# RFC — CI cost optimization

## Summary

`.github/workflows/ci.yml` is a single ~1,365-line file with **29 jobs**. A
full run (push to `main`, or any PR that touches ActiveRecord) bills roughly
**48–50 GitHub-Actions job-minutes**, of which the three ActiveRecord adapter
jobs alone are **~24 minutes (≈50%)**. On an active development day the repo
sees **~370 CI runs**; the measured 60-run window below burned **1,781 billed
job-minutes in ~1h45m**, and **34% of that went to runs that were ultimately
cancelled** by the PR concurrency guard.

This RFC ranks every job by **measured** billed minutes (pulled from the GitHub
API across 60 recent runs), then proposes a prioritized set of independently
shippable stories that cut billed minutes and/or time-to-green. Each story
names the exact job(s)/YAML to change, a diff mechanism, acceptance criteria, a
risk level, and an estimated minutes-saved-per-run.

### Important billing context: this is a **public** repo

`blazetrailsdev/trails` is **public**, and every job runs on the standard
`ubuntu-latest` hosted runner (`vars.RUNNER` is currently **unset**, so the
`${{ vars.RUNNER || 'ubuntu-latest' }}` jobs all resolve to hosted). **GitHub
does not bill standard hosted-runner minutes on public repositories** — so the
direct GitHub invoice for this workflow today is **$0**.

That does **not** make minutes free. The real costs the minutes proxy for:

1. **Throughput / queue contention.** Public repos get a bounded pool of
   concurrent standard runners. At ~370 runs/day from a parallel agent fleet,
   the pool saturates and jobs **queue** — every wasted minute delays some
   other agent's time-to-green. This is the dominant _today_ cost.
2. **Developer/agent wall-clock** (time-to-green) — directly gated by the
   slowest critical-path job (the AR adapter suites).
3. **Real dollars on the self-hosted lever.** The `setup-pnpm` composite action
   and `vars.RUNNER` plumbing exist to move heavy jobs onto a self-hosted box;
   there those minutes cost electricity/hardware/WAN. The action's own header
   documents a prior **~1 TB WAN-egress incident** from a mis-cached pnpm store
   — i.e. self-hosted cost is already a lived problem.
4. **Future dollars** if the repo ever goes private or adopts paid larger
   runners.

So this RFC treats **billed job-minutes as the portable currency** and quotes a
**shadow cost** at GitHub's standard Linux rate ($0.008/min) so stories can be
ROI-ranked — the ranking holds whether the minutes are billed today, contended
today, or billed tomorrow.

## Motivation

### Methodology

- Pulled `repos/blazetrailsdev/trails/actions/runs/<id>/jobs` for the **60 most
  recent CI runs** (mix of `push` and `pull_request`; 24 success, 5 failure, 31
  cancelled).
- Per job: `billed = max(1, ceil((completed_at − started_at) / 60))` — GitHub
  **rounds every job up to the next whole minute**, so a 3-second job still
  bills 1 minute. Skipped jobs cost 0 and are excluded.
- Averaged per-job billed minutes over the **7 successful `push` runs** (the
  canonical "full matrix" shape) for the ranked table; cross-checked against 15
  successful AR-affecting PR runs (numbers within ~5%).
- Cadence and conclusion mix sampled over the last 200 runs.

### Measured per-job cost (ranked, avg over successful `push` runs)

| Rank | Job                            | Avg wall | Billed/run | Notes                                              |
| ---- | ------------------------------ | -------- | ---------- | -------------------------------------------------- |
| 1    | Active Record PostgreSQL Tests | 556 s    | **9.86**   | `pnpm install`+`pnpm build`+vitest, 8 forks, tmpfs |
| 2    | Active Record MariaDB Tests    | 468 s    | **8.43**   | mysql2 adapter vs MariaDB stand-in, 8 forks        |
| 3    | Active Record SQLite Tests     | 325 s    | **5.86**   | no service container                               |
| 4    | Website                        | 225 s    | 4.00       | SvelteKit + typedoc + VitePress                    |
| 5    | Rails API/Test Comparison      | 133 s    | 2.86       | Ruby + pnpm build + vendored-source fetch          |
| 6    | Virtualized DX Type Tests      | 77 s     | 2.00       |                                                    |
| 7    | Guides Code Type Check         | 76 s     | 2.00       | `pnpm build` again                                 |
| 8    | Build & Type Check             | 76 s     | 2.00       | the canonical build                                |
| 9    | Unit Tests                     | 68 s     | 2.00       |                                                    |
| 10   | Lint                           | 58 s     | 1.29       |                                                    |
| 11   | Action Pack Tests              | 50 s     | 1.00       | <60 s → billed 1 min                               |
| 12   | Trailties Tests                | 42 s     | 1.00       | <60 s                                              |
| 13   | DX Type Tests                  | 30 s     | 1.00       | <60 s                                              |
| 14   | Rack Tests                     | 27 s     | 1.00       | <60 s                                              |
| 15   | Action View Tests              | 26 s     | 1.00       | <60 s                                              |
| 16   | TSE Compiler Tests             | 22 s     | 1.00       | <60 s                                              |
| 17   | Prettier                       | 14 s     | 1.00       | <60 s                                              |
| 18   | Detect changed paths           | 8 s      | 1.00       | <60 s                                              |
| —    | Docs ActiveRecord Freeze (PR)  | 8 s      | 1.00       | PR-only, <60 s                                     |
| —    | PR Attribution Check (PR)      | 3 s      | 1.00       | PR-only, <60 s                                     |

**Full-run total: ~48 billed job-min (push) / ~50 (full AR PR).**

### Where the money goes

- **AR adapter trio = ~24 min (≈50% of a full run).** PG + MariaDB + SQLite.
  This is the single biggest cost center and the critical-path long pole.
- **Per-minute rounding tax.** On a full AR PR, **~10 jobs each run <60 s but
  bill a full minute** (Detect, Prettier, Docs-Freeze, PR-Attribution, Action
  Pack, Trailties, DX-Type, Rack, Action View, TSE) — ~10 billed minutes for
  **~3.6 minutes of actual compute**. ~6 min/run is pure rounding headroom.
- **Cancelled-run waste = 34% of the sampled spend (607 of 1,781 job-min).**
  PR concurrency cancels superseded runs (`cancel-in-progress` is correctly ON
  for PRs), but the expensive AR jobs gate only on `needs: changes` and start
  almost immediately, so a rapid re-push cancels them **mid-run** after they've
  already burned several minutes. Conclusion mix over the last 200 runs:
  **43.5% cancelled, 17.5% failure, 39% success.**
- **Redundant full builds.** `pnpm build` runs in **6 jobs** per full run
  (Build&TC, Guides, SQLite, PostgreSQL, MariaDB, Rails-comparison) plus two
  partial builds in the parity-trails jobs — the build artifact is never shared.
- **Flake reruns.** Repo memory documents several shared-table CI flakes
  (date+attribute-methods PG, items/posts/people table collisions). A flaky AR
  job re-run re-bills the whole 6–10 min job; the 17.5% failure rate includes an
  unmeasured slice of these.

### Shadow cost

At GitHub's standard Linux rate ($0.008/job-min):

- Full run ≈ **$0.38**.
- Daily (≈370 runs × ≈29.7 avg billed job-min/run across the success/cancel/
  fail mix) ≈ **10,990 job-min/day ≈ $88/day ≈ ~$1,900/mo** on an active month.

Again: **billed at $0 today** (public repo, hosted runners). Read these as the
value of the throughput/contention recovered today and the invoice avoided if
the repo ever goes private or moves heavy jobs to self-hosted/paid runners.

## Design

Stories are grouped into four clusters, all **coverage-neutral**: none reduces
test or adapter coverage and none spends real dollars. Two higher-risk
dimensions were analyzed and explicitly **rejected by the owner** (2026-06-15);
they are documented under "Rejected dimensions" below rather than carried as
stories, because this repo's #1 principle is Rails fidelity.

### Cluster: caching-install

- `route-all-jobs-through-setup-pnpm-composite` — foundational. Several jobs
  inline `pnpm/action-setup` + `setup-node` instead of using the
  `./.github/actions/setup-pnpm` composite. Unify them and add
  `--prefer-offline` to installs. Centralizes the self-hosted/cache strategy so
  later tuning lands in one place. Unblocks `cache-build-dist-across-jobs`.
- `cache-build-dist-across-jobs` — build the workspace once and restore the
  `dist/` outputs in the 5 jobs that currently re-run `pnpm build`, keyed on a
  source-tree hash (no job-dependency edge, so parallelism is preserved).

### Cluster: change-gating

- `gate-ar-jobs-behind-build` — make the AR adapter jobs `needs:
[changes, build-and-typecheck]` so a re-push cancels them **before** they
  burn minutes. Cost-vs-latency tradeoff (adds ~build-time latency to the AR
  happy path) — quantified in the story.
- `tighten-rails-comparison-and-lint-gating` — `rails-comparison` (2.86 min)
  and `lint` run on **every** non-docs PR even when no package source or
  compare script changed; gate them on relevant affected-paths.

### Cluster: parallelism-rounding

- `consolidate-preflight-micro-jobs` — fold the three sub-second PR-only checks
  (Prettier, Docs-Freeze, PR-Attribution) into one preflight job (or into
  `changes`) to reclaim the per-minute rounding tax.
- `consolidate-leaf-test-jobs` — collapse the tiny leaf test jobs (Rack,
  Action View, TSE, DX-Type, …) into a single job that internally runs only the
  affected packages, trading a little gating granularity for rounding savings.
- `tune-ar-db-forks-to-runner-cores` — `AR_DB_FORKS: 8` on 2-core hosted
  runners over-subscribes; right-size to recover wall-clock (latency lever).

### Cluster: flake-cost

- `flake-elimination-as-ci-cost` — quantify and attack the top shared-table
  flakes as a direct cost line (each rerun re-bills a 6–10 min job).
  Depends on RFC 0019 (canonical-schema burndown).

### Rejected dimensions (owner decision, 2026-06-15)

Two higher-savings levers were analyzed and **rejected** — they are recorded
here so the analysis is preserved and not re-proposed:

- **Adapter sampling on PRs** (would have been the single biggest lever,
  ~18 billed min/PR: run only SQLite on PRs, full PG+MariaDB trio on `main` +
  nightly). **Rejected — coverage cut not acceptable.** The fidelity cost of
  catching PG/MariaDB-specific regressions only post-merge outweighs the
  minutes; all three adapters continue to run on every AR PR.
- **Runner sizing / self-hosted move** (`vars.RUNNER` break-even,
  larger-paid-runner vs self-hosted). **Rejected — stay on free hosted
  runners.** No real-dollar spend or self-hosted/WAN exposure will be taken on;
  current queue contention is accepted as-is.

## Alternatives considered

- **Swap MariaDB back to mysql:8 / drop a DB engine outright.** Rejected —
  already analyzed in repo memory (mysql:8 is ~2.15× slower; MariaDB is the
  current stand-in), and the owner has ruled out adapter-coverage cuts (see
  "Rejected dimensions").
- **Move everything to a larger paid runner for speed.** Rejected — on a public
  repo that converts $0 into real spend and is cost-negative unless queue
  contention is proven binding; the owner has chosen to stay on free hosted
  runners (see "Rejected dimensions").
- **Do nothing (minutes are free on a public repo).** Rejected — throughput
  contention and self-hosted/private-repo exposure are real, and the
  rounding/cancellation waste is cheap to remove.

## Rollout

1. **Foundational** — `route-all-jobs-through-setup-pnpm-composite`.
2. **Safe quick wins (parallel, independent)** —
   `consolidate-preflight-micro-jobs`, `gate-ar-jobs-behind-build`,
   `tighten-rails-comparison-and-lint-gating`,
   `cache-build-dist-across-jobs` (after #1).
3. **Medium** — `consolidate-leaf-test-jobs`, `tune-ar-db-forks-to-runner-cores`,
   `flake-elimination-as-ci-cost`.

## Open questions

1. **Is queue contention actually binding today?** The throughput argument rests
   on the concurrency pool saturating at ~370 runs/day. Measuring queue-wait
   time (run `created_at` → first job `started_at`) would confirm or weaken it.
   Not blocking any of the coverage-neutral stories.

## Stories

Est-LOC is the implementer's PR-size budget (additions + deletions), capped at
the trails 500-LOC ceiling. Risk and estimated savings live in each story's
body. All eight stories are coverage-neutral. **Top 5 by ROI:**
`gate-ar-jobs-behind-build`, `consolidate-preflight-micro-jobs`,
`consolidate-leaf-test-jobs`, `cache-build-dist-across-jobs`,
`tighten-rails-comparison-and-lint-gating`.

<!-- generated: stories table -->

| ID                                                                                                    | Title                                                                           | Status | Est LOC | Cluster              |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ | ------- | -------------------- |
| [cache-build-dist-across-jobs](stories/cache-build-dist-across-jobs.md)                               | Cache the workspace build output so jobs stop re-running pnpm build             | draft  | 180     | caching-install      |
| [consolidate-leaf-test-jobs](stories/consolidate-leaf-test-jobs.md)                                   | Consolidate the tiny leaf test jobs into one affected-aware job                 | draft  | 160     | parallelism-rounding |
| [consolidate-preflight-micro-jobs](stories/consolidate-preflight-micro-jobs.md)                       | Consolidate the sub-second preflight checks into one job to reclaim rounding    | draft  | 120     | parallelism-rounding |
| [flake-elimination-as-ci-cost](stories/flake-elimination-as-ci-cost.md)                               | Attack the top shared-table flakes as a direct CI-cost line                     | draft  | 200     | flake-cost           |
| [gate-ar-jobs-behind-build](stories/gate-ar-jobs-behind-build.md)                                     | Gate the AR adapter jobs behind build-and-typecheck to cut cancelled-run waste  | draft  | 40      | change-gating        |
| [route-all-jobs-through-setup-pnpm-composite](stories/route-all-jobs-through-setup-pnpm-composite.md) | Route all jobs through the setup-pnpm composite and add --prefer-offline        | draft  | 120     | caching-install      |
| [tighten-rails-comparison-and-lint-gating](stories/tighten-rails-comparison-and-lint-gating.md)       | Gate rails-comparison and lint on relevant changes instead of every non-docs PR | draft  | 90      | change-gating        |
| [tune-ar-db-forks-to-runner-cores](stories/tune-ar-db-forks-to-runner-cores.md)                       | Right-size AR_DB_FORKS to the runner core count                                 | draft  | 30      | parallelism-rounding |

## Changelog

- 2026-06-15: initial RFC; cost analysis over 60-run window; 10 stories.
- 2026-06-15: owner rejected both needs-approval dimensions (adapter sampling,
  runner sizing / self-hosted); dropped those two stories. 8 coverage-neutral
  stories remain.
