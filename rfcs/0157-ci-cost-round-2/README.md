---
rfc: "0157-ci-cost-round-2"
title: "CI cost, round 2 — the costs RFC 0028 created or could not reach"
status: draft
created: 2026-09-23
updated: 2026-09-23
owner: "@deanmarano"
packages: []
clusters:
  - parallelism-rounding
  - caching-install
related-rfcs:
  - "0028-ci-cost-optimization"
  - "0125-typescript-7-ground-floor"
  - "0061-ci-failures"
priority: 5
---

# RFC 0000 — CI cost, round 2

## Summary

RFC `0028-ci-cost-optimization` is closed and did its job: change-gating,
install/build caching, draft deferral, label opt-ins, and 2-way sharding of the
PostgreSQL and MariaDB AR suites all landed and all measured. This RFC is the
successor for two costs that survived it — one that 0028's own fix **created**,
and one that 0028's fix **cannot reach by construction**.

It inherits 0028's measurement protocol unchanged (§ Measurement protocol), and
it deliberately inherits its rejected dimensions too: no paid larger runners, no
adapter-coverage cuts, no self-hosted requirement.

## Motivation

Measured on green `main` run 35872727737 (2026-09-23). Per-job wall-clock:

| job                                | wall     |
| ---------------------------------- | -------- |
| **Active Record SQLite :memory:**  | **789s** |
| Active Record PostgreSQL Tests (2) | 572s     |
| Active Record PostgreSQL Tests (1) | 568s     |
| Active Record MariaDB Tests (2)    | 558s     |
| Active Record MariaDB Tests (1)    | 527s     |
| Active Record SQLite Tests (1)     | 473s     |
| Active Record SQLite Tests (2)     | 435s     |
| Rails API/Test Comparison          | 317s     |
| Unit Tests                         | 285s     |
| Lint                               | 115s     |

Two facts fall out of it.

### 1. Sharding moved the critical path rather than removing it

0028's `shard-ar-adapter-suites` (trails#4546) sharded PG and MariaDB and
explicitly left SQLite alone — its last acceptance criterion reads "sqlite-tests
left unsharded (not on the critical path)". Sharding the other two **made**
SQLite the critical path, so `sqlite-tests` was sharded later, and the `ci.yml`
comment records the pattern in as many words:

> That story left this lane unsharded as "not on the critical path"; sharding
> the other two made it the critical path, so the exemption no longer holds.

It has now happened a third time. `sqlite-mem-tests` is the last unsharded AR
lane and is the `main` critical path at 789s. This is a displacement pattern,
not three coincidences: the right closing condition is "every AR lane is
sharded", not "the current longest one is".

### 2. The build cache cannot hit on a PR that changes source

0028's `cache-build-dist-across-jobs` (trails#3392) exists so jobs stop
recompiling the workspace. Its key is an exact content hash of
`packages/**/src/**` with no `restore-keys`, so **any source edit misses by
construction** — which is every PR the cache was built for. Confirmed in that
run's log: `Cache not found for input keys: build-v1-Linux-f60646f8…`.

`pnpm build` consequently runs 11 times per run, costing **647s of runner time**
and ~60s on the critical path of every long-pole lane.

The exact-match design is **correct and must not be relaxed.** `tsc --build`
treats a restored `.tsbuildinfo` as authoritative and skips projects it
considers up to date, so a stale restore lets a changed exported signature leave
a consumer package uncompiled and its breakage invisible. That is a known,
bitten failure mode in this repo. The cache is doing the only safe thing
available to it; the redundant compile is simply not a caching problem.

## Design

Two stories, one per finding.

- **`shard-ar-sqlite-mem-lane`** — close the displacement pattern by sharding
  the last unsharded AR lane. Cheapest of the four to shard: no service
  container, and a single-step body with nothing to pin to shard 1.
- **`build-cache-cannot-hit-on-source-changing-pr`** — a findings-and-decision
  story, not an implementation. It records the measurement and forces a choice
  between the two real remedies:
  1. **Make the compile ~10× cheaper** — RFC `0125-typescript-7-ground-floor`.
     Measured on this repo: cold full `tsc --build` 91.75s → 8.47s. Turns 647s
     into roughly 60s with no CI change and the cache's safety property intact.
     Its terminal story `flip-build-to-ts7` now carries this measurement, and is
     blocked on three API ports plus 7.1 stable (2026-11-24).
  2. **Build once, distribute the artifact** — the `upload-artifact` →
     `download-artifact` fallback 0028's own story Notes anticipated. Safe where
     `restore-keys` is not, because there is one authoritative full build per
     run. Costs the `needs:` edge 0028 refused: ~9 min of runner time traded for
     roughly +40s of wall clock.

Remedy 1 strictly dominates if TS 7 lands on schedule; remedy 2 is the hedge.

## Non-goals

- **Adding `restore-keys` to `cache-build`.** Unsafe for the reason above. This
  is the single most likely "obvious fix" a future reader will reach for, so it
  is named here canonically.
- **Removing `cache-build`.** It still earns its place on re-runs of an
  unchanged commit and costs ~3s when it misses.
- **CI _failures_ / flake burndown.** That is RFC `0061-ci-failures`. This RFC
  is cost and wall-clock only.
- **Paid larger runners, self-hosted-only strategies, adapter-coverage cuts.**
  Inherited rejections from 0028's "Rejected dimensions"; not reopened here.
- **Splitting packages into separate repos for more free CI capacity.** GitHub
  Actions concurrency is per _account_, not per repository, so N repos under one
  org share one pool and nothing is gained; and the parity gates compare against
  one manifest built across the whole tree.

## Measurement protocol

Inherited verbatim from RFC 0028 § "Measurement protocol & go/no-go gate". In
short: every story's PR is an experiment with a kill switch, primary metric is
**median time-to-green over ≥5 runs** against a re-baselined `main`, go is
**≥10% or ≥15s, whichever is larger**, no-go means close the PR and mark the
story `blocked` with the negative finding. Every PR description carries the
before/after table.

One addition: `sqlite-mem-tests` does not run on ordinary PRs (it is gated to
`main`, the Monday sweep, `workflow_dispatch`, and the `run-sqlite-mem` label),
so its story baselines on **`main` runs**, not PR runs.

## Alternatives considered

- **Reopen RFC 0028.** Rejected: it is closed with 74 stories and a completed
  measurement round. A successor keeps the closed round's conclusions legible
  and lets this round carry its own baseline, which the protocol requires anyway
  ("re-baseline per experiment — do not compare against numbers in this RFC").
- **File these under `0061-ci-failures`.** Rejected: 0061's scope is CI failures
  (flakes, reds), not cost or wall-clock, and its README is still an unfilled
  skeleton.

## Rollout

Both stories stand alone and branch from `main`. `shard-ar-sqlite-mem-lane` is
independent and can ship immediately. `build-cache-cannot-hit-on-source-changing-pr`
is a decision story whose outcome depends on `flip-build-to-ts7`'s expected
landing date; it should be revisited once RFC 0125's three API ports are done.
