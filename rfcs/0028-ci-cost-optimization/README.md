---
rfc: "0028-ci-cost-optimization"
title: "CI cost optimization — cut billed Actions minutes and time-to-green"
status: active
created: 2026-06-14
updated: 2026-06-14
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

# RFC 0028 — CI cost optimization

## Summary

`.github/workflows/ci.yml` is a single ~1,365-line file with **29 jobs**. A
full run (push to `main`, or any PR that touches ActiveRecord) bills roughly
**48–50 GitHub-Actions job-minutes**, of which the three ActiveRecord adapter
jobs alone are **~24 minutes (≈50%)**. On an active development day the repo
sees **~370 CI runs**; the measured 60-run window below burned **1,781 billed
job-minutes in ~1h45m**, and **34% of that went to runs that were ultimately
cancelled** by the PR concurrency guard.

This RFC ranks every job by **measured** billed minutes (pulled from the GitHub
API across 60 recent runs), then proposes **seven independently shippable,
coverage-neutral stories** that cut wall time and/or billed minutes. Each story
names the exact job(s)/YAML to change, a diff mechanism, acceptance criteria, a
risk level, and an estimated savings. Two higher-savings but higher-risk
dimensions (PR adapter sampling; runner sizing / self-hosted) were analyzed and
**rejected by the owner** — see "Rejected dimensions".

### Wall time is the merge bar

The owner's primary objective is **wall time (time-to-green), not billed
minutes** (the repo is public, so the GitHub invoice is already $0). Every story
is therefore gated: its PR **merges only if it measurably improves wall time**,
and **is closed — not merged — if the before/after comparison shows no real
gain**. See "Measurement protocol & go/no-go gate" for the exact metric and
threshold. This reframes the per-story estimates: billed-minute savings are now
**secondary evidence**; the deciding number is median time-to-green vs `main`.
Stories are classified MOVER / ENABLER / CONTENTION-ONLY by their expected
wall-time effect so the at-risk ones are obvious before any implementation
effort is spent.

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
dimensions were analyzed and explicitly **rejected by the owner** (2026-06-14);
they are documented under "Rejected dimensions" below rather than carried as
stories, because this repo's #1 principle is Rails fidelity.

Each bullet is tagged with its **expected wall-time impact** (the merge bar):
**MOVER** = directly shortens the critical path; **ENABLER** = little wall-time
effect alone, justified only as a prerequisite for a MOVER; **CONTENTION-ONLY**
= no effect on an uncontended run (the jobs are off the critical path), helps
only via reduced runner-pool queueing — the highest close-risk under the gate.

### Cluster: caching-install

- `cache-build-dist-across-jobs` — **MOVER.** Build the workspace once and
  restore the `dist/` outputs in the 5 jobs that currently re-run `pnpm build`,
  keyed on a source-tree hash (no job-dependency edge, so parallelism is
  preserved). Removes ~30–45 s of `pnpm build` from the AR critical-path jobs.
- `route-all-jobs-through-setup-pnpm-composite` — **ENABLER.** Several jobs
  inline `pnpm/action-setup` + `setup-node` instead of using the
  `./.github/actions/setup-pnpm` composite. Unify them and add
  `--prefer-offline`. Marginal wall-time on its own; merges only as the
  prerequisite for `cache-build-dist-across-jobs` (and is closed with it if that
  story shows no gain).

### Cluster: change-gating

- `tighten-rails-comparison-and-lint-gating` — **MOVER on non-package PRs,
  neutral on AR PRs.** `rails-comparison` (2.86 min) and `lint` run on **every**
  non-docs PR even when no package source or compare script changed; gate them
  on relevant affected-paths. On a tasks/tooling-only PR (AR jobs skipped)
  `rails-comparison` is near the long pole, so skipping it shortens
  time-to-green; on an AR PR the 6–10 min adapter jobs dominate and this is
  neutral.

### Cluster: parallelism-rounding

- `tune-ar-db-forks-to-runner-cores` — **MOVER.** `AR_DB_FORKS: 8` on 2-core
  hosted runners over-subscribes; right-size to recover wall-clock on the two
  longest jobs (PG 9.86, MariaDB 8.43).
- `consolidate-preflight-micro-jobs` — **CONTENTION-ONLY.** Fold the three
  sub-minute PR-only checks (Prettier, Docs-Freeze, PR-Attribution) into one
  preflight job. Reclaims billed-minute rounding, but those jobs are sub-minute
  and run in parallel off the critical path, so on an uncontended run wall time
  is unchanged — benefit only shows as reduced queueing.
- `consolidate-leaf-test-jobs` — **CONTENTION-ONLY.** Collapse the tiny leaf
  test jobs (Rack, Action View, TSE, DX-Type, …) into one affected-aware job.
  Same profile as above: parallel sub-minute jobs are off the critical path.

### Cluster: flake-cost

- `flake-elimination-as-ci-cost` — **MOVER (tail/median).** Each flaky rerun
  adds a full 6–10 min AR job to time-to-green; eliminating the top shared-table
  collisions removes those excursions. Depends on RFC 0019 (canonical-schema
  burndown).

### Reconsidered under the wall-time bar

- **`gate-ar-jobs-behind-build` (dropped 2026-06-15).** Adding
  `build-and-typecheck` to the AR jobs' `needs:` would cut the 34%
  cancelled-run billed-minute waste, but it **adds ~build-time latency to the AR
  happy path — i.e. it makes per-PR wall time worse, not better.** Under the
  wall-time merge bar it fails by construction (its before/after would show a
  regression on every non-cancelled PR), so it is not carried as a story. The
  cancellation-waste finding is preserved in "Where the money goes" for the
  record.

### Rejected dimensions (owner decision, 2026-06-14)

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

## Measurement protocol & go/no-go gate

Every story's PR is an **experiment with a kill switch**. None merges on the
strength of its estimate; it merges only on a measured wall-time win, and is
**closed** otherwise. This section is the contract each story's "Measurement &
go/no-go" section instantiates.

**Primary metric — median time-to-green.** Workflow run `created_at` → the last
required check completing, which includes runner-queue wait (so contention
relief counts). Take the **median over ≥5 runs** of the affected scenario
(e.g. an AR-affecting PR for the AR stories; a tasks-only PR for the gating
story) to average out flake/queue noise. Compare against a `main` baseline
measured over the same window (CI conditions drift, so re-baseline per
experiment — do not compare against numbers in this RFC).

**Secondary metrics.** The targeted job's median wall-clock (for MOVER stories
this should move even when end-to-end doesn't) and total billed job-minutes
(cost, now secondary).

**The gate.**

- **Go (merge):** median time-to-green **or** the targeted job's wall-clock
  drops beyond run-to-run noise — use **≥10% or ≥15 s, whichever is larger** —
  with no correctness or coverage regression.
- **No-go (close):** the change is within noise. Close the PR, record the
  before/after table in it, and mark the story `blocked` with the negative
  finding so it is not silently retried.
- **CONTENTION-ONLY stories** can only pass if measured **while the runner pool
  is saturated** (the win is queue-wait, invisible on a quiet repo). If
  contention can't be reproduced/measured, default to **no-go** rather than
  merging on the theoretical argument.
- **ENABLER stories** (`route-all-jobs-through-setup-pnpm-composite`) are judged
  on their dependent: merge only bundled with / ahead of a MOVER that clears the
  gate; if the MOVER is closed, close the enabler too.

**Every PR description must include the before/after table** (time-to-green
median, targeted-job wall-clock, billed minutes; run count and dates). A PR
without it is not reviewable.

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

Sequenced highest-confidence-MOVER first, so effort is spent where the gate is
most likely to pass:

1. **MOVERs (do first, independent)** — `cache-build-dist-across-jobs` (bundle
   its ENABLER `route-all-jobs-through-setup-pnpm-composite`),
   `tune-ar-db-forks-to-runner-cores`, `flake-elimination-as-ci-cost`,
   `tighten-rails-comparison-and-lint-gating` (measured on non-package PRs).
2. **CONTENTION-ONLY (only if a saturation window can be measured; else defer)**
   — `consolidate-preflight-micro-jobs`, `consolidate-leaf-test-jobs`.

Each proceeds through its own go/no-go gate; a no-go closes that PR without
affecting the others.

## Open questions

1. **Is queue contention actually binding today?** The throughput argument rests
   on the concurrency pool saturating at ~370 runs/day. Measuring queue-wait
   time (run `created_at` → first job `started_at`) would confirm or weaken it.
   This is **decisive for the two CONTENTION-ONLY stories** — without measurable
   saturation they default to no-go — but does not affect the MOVER stories,
   which shorten the critical path regardless.

## Stories

Est-LOC is the implementer's PR-size budget (additions + deletions), capped at
the trails 500-LOC ceiling. Risk, expected wall-time impact, and the go/no-go
gate live in each story's body. All seven stories are coverage-neutral and each
merges only if its before/after measurement clears the gate (see "Measurement
protocol"). **Highest-confidence MOVERs:** `cache-build-dist-across-jobs`,
`tune-ar-db-forks-to-runner-cores`, `flake-elimination-as-ci-cost`,
`tighten-rails-comparison-and-lint-gating` (non-package PRs). **Highest
close-risk (CONTENTION-ONLY):** `consolidate-preflight-micro-jobs`,
`consolidate-leaf-test-jobs`.

<!-- generated: stories table -->

| ID                                                                                                                                | Title                                                                                               | Status | Est LOC | Cluster              |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ | ------- | -------------------- |
| [ar-test-reset-shape-stable-impl](stories/ar-test-reset-shape-stable-impl.md)                                                     | Implement shape-stable reset to cut DROP TABLE churn (dominant path)                                | draft  | 300     | —                    |
| [batch-drop-all-tables-single-statement](stories/batch-drop-all-tables-single-statement.md)                                       | Batch dropAllTables into one multi-table DROP (86k round-trips -> hundreds)                         | draft  | 80      | —                    |
| [flake-elimination-as-ci-cost](stories/flake-elimination-as-ci-cost.md)                                                           | Attack the top shared-table flakes as a direct CI-cost line                                         | ready  | 200     | flake-cost           |
| [pg-disable-referential-integrity-session-replication-role](stories/pg-disable-referential-integrity-session-replication-role.md) | Converge PG disableReferentialIntegrity to session_replication_role (saves ~46s PG DDL)             | ready  | 120     | —                    |
| [schema-dumping-schemas-timeout-flake](stories/schema-dumping-schemas-timeout-flake.md)                                           | Fix recurring 'dumping schemas' 5s timeout flake in postgresql/schema.test.ts                       | ready  | 15      | —                    |
| [trails-tsc-blocking-test-gate](stories/trails-tsc-blocking-test-gate.md)                                                         | Run trails-tsc unit tests in a blocking CI job                                                      | ready  | 40      | —                    |
| [ar-cli-coverage-reporting](stories/ar-cli-coverage-reporting.md)                                                                 | Add reporting-only coverage for activerecord-cli                                                    | done   | 40      | —                    |
| [ar-sqlite-lane-coverage-reporting](stories/ar-sqlite-lane-coverage-reporting.md)                                                 | ar-sqlite-lane-coverage-reporting                                                                   | done   | null    | —                    |
| [ar-test-reset-bespoke-table-teardown-ratchet](stories/ar-test-reset-bespoke-table-teardown-ratchet.md)                           | Tighten require-table-teardown ratchet to curb leaked bespoke tables (Path D)                       | done   | 120     | —                    |
| [ar-test-reset-drop-table-churn](stories/ar-test-reset-drop-table-churn.md)                                                       | Spike: locate the dominant DROP TABLE source in AR test teardown (86k/run)                          | done   | 60      | —                    |
| [ar-test-reset-raw-sql-teardown-burndown](stories/ar-test-reset-raw-sql-teardown-burndown.md)                                     | Burn down require-table-teardown raw-SQL grandfather list to zero (Path D)                          | done   | 300     | —                    |
| [ar-test-reset-signature-cache-no-blanket-clear](stories/ar-test-reset-signature-cache-no-blanket-clear.md)                       | dropAllTables: reconcile signature cache instead of blanket clear (Path C)                          | done   | 80      | —                    |
| [ar-test-reset-verify-raw-sql-burndown-churn-payoff](stories/ar-test-reset-verify-raw-sql-burndown-churn-payoff.md)               | Verify the dropAllTables distinct-table fan-out actually shrank after the raw-SQL teardown burndown | done   | 40      | —                    |
| [cache-build-dist-across-jobs](stories/cache-build-dist-across-jobs.md)                                                           | Cache the workspace build output so jobs stop re-running pnpm build                                 | done   | 180     | caching-install      |
| [consolidate-leaf-test-jobs](stories/consolidate-leaf-test-jobs.md)                                                               | Consolidate the tiny leaf test jobs into one affected-aware job                                     | done   | 160     | parallelism-rounding |
| [consolidate-preflight-micro-jobs](stories/consolidate-preflight-micro-jobs.md)                                                   | Consolidate the sub-minute preflight checks into one job to reclaim rounding                        | done   | 120     | parallelism-rounding |
| [decouple-ar-slot-pool-from-worker-count](stories/decouple-ar-slot-pool-from-worker-count.md)                                     | Decouple AR advisory-slot pool from vitest worker count (add headroom)                              | done   | 40      | —                    |
| [route-all-jobs-through-setup-pnpm-composite](stories/route-all-jobs-through-setup-pnpm-composite.md)                             | Route all jobs through the setup-pnpm composite and add --prefer-offline                            | done   | 120     | caching-install      |
| [tighten-rails-comparison-and-lint-gating](stories/tighten-rails-comparison-and-lint-gating.md)                                   | Gate rails-comparison and lint on relevant changes instead of every non-docs PR                     | done   | 90      | change-gating        |
| [trails-tsc-coverage-isolation](stories/trails-tsc-coverage-isolation.md)                                                         | Collect trails-tsc coverage without voiding the shared run                                          | done   | 60      | —                    |
| [tune-ar-db-forks-to-runner-cores](stories/tune-ar-db-forks-to-runner-cores.md)                                                   | Right-size AR_DB_FORKS to the runner core count                                                     | done   | 30      | parallelism-rounding |

## Changelog

- 2026-06-14: initial RFC; cost analysis over 60-run window; 10 stories.
- 2026-06-14: owner rejected both needs-approval dimensions (adapter sampling,
  runner sizing / self-hosted); dropped those two stories. 8 coverage-neutral
  stories remain.
- 2026-06-14: review fixes — corrected frontmatter dates, retitled the preflight
  story "sub-minute" (checks run 3–14 s, not sub-second), and scoped the
  AR_DB_FORKS story to the two live DB jobs (mysql-tests is disabled).
- 2026-06-15: wall-time merge bar — every story now carries a "Measurement &
  go/no-go" gate (merge only on a measured time-to-green win vs `main`, else
  close); added the "Measurement protocol" section; tagged each story MOVER /
  ENABLER / CONTENTION-ONLY; dropped `gate-ar-jobs-behind-build` (wall-time-
  negative by design). 7 stories remain.
