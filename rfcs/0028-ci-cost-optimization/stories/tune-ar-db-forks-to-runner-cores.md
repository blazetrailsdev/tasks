---
title: "Right-size AR_DB_FORKS to the runner core count"
status: done
updated: 2026-06-22
rfc: "0028-ci-cost-optimization"
cluster: parallelism-rounding
deps: []
deps-rfc: []
est-loc: 30
priority: 20
pr: 3870
claim: "2026-06-22T11:32:47Z"
assignee: "tune-ar-db-forks-to-runner-cores"
blocked-by: null
---

## Context

`postgres-tests` and `maria-tests` (and the disabled `mysql-tests`) set
`AR_DB_FORKS: 8` for the activerecord vitest run. The standard `ubuntu-latest`
hosted runner has **2 vCPUs**. Eight forks against a 2-core runner plus a
service-container DB on the same host is heavily over-subscribed: forks contend
for CPU and for the DB's connection/IO budget, which can _increase_ wall-clock
versus a fork count matched to available cores, even on a DDL-heavy suite where
some latency is IO-bound on the (tmpfs-backed) DB.

These are the two longest jobs in CI (PG 9.86 min, Maria 8.43 min), so even a
modest wall-clock improvement is the highest-value latency win available without
touching coverage.

## Acceptance criteria

- [ ] Empirically determine the fork count that minimizes wall-clock for the AR
      vitest run on a 2-core hosted runner (compare at least 8 vs 4 vs 2, and
      vs `--maxWorkers`-derived auto). Record the measured wall-clocks in the PR
      description.
- [ ] Set `AR_DB_FORKS` to the measured-best value across the two live AR DB
      jobs, `postgres-tests` and `maria-tests` (keep them consistent). Also
      update the disabled `mysql-tests` job for consistency so it is correct when
      re-enabled, but it is not exercised by CI today. If 8 turns out to be
      optimal, document that with the measurements and close as a no-op
      finding — the measurement is the deliverable.
- [ ] CI green; confirm the AR suites still pass deterministically at the new
      fork count (watch for newly-surfaced shared-table flakes — see
      `flake-elimination-as-ci-cost`).

## Savings & risk

- **Expected wall-time impact: MOVER.** Directly targets the wall-clock of the
  two longest jobs (PG 9.86, MariaDB 8.43); the measurement (below) is also the
  deliverable, so a no-result outcome is a documented finding, not a failure.
- **Est. savings:** primarily **wall-clock / latency** on the two longest jobs;
  possibly ~1–2 billed job-min/run if the change crosses minute boundaries.
  Could be net-zero billed minutes if it only shifts wall-clock without crossing
  a boundary — that is still a throughput win under queue contention.
- **Risk:** low–medium. Fork count interacts with the shared-table flakes
  documented in repo memory; a different fork count can change test scheduling
  and surface (or hide) collisions. Validate across a few reruns before landing.

## Measurement & go/no-go

The fork sweep already produces the before/after data; this gate just makes the
merge decision explicit (see the RFC's "Measurement protocol").

- [ ] Record median wall-clock of `postgres-tests` and `maria-tests` at the
      current `AR_DB_FORKS: 8` over ≥5 runs (baseline) and at each candidate
      fork count over ≥5 runs each.
- [ ] **Go:** the chosen fork count cuts the median PG/MariaDB job wall-clock by
      ≥10% or ≥15 s without new flake failures. **No-go:** if no count beats 8
      beyond noise, keep 8, record the finding, and close the PR as a
      documented no-op (the measurement is the value).
- [ ] PR description includes the per-fork-count wall-clock table + the flake
      check across reruns.

## Notes

Coordinate with whoever holds RFC 0019 (canonical-schema burndown): if fork
changes surface new collisions, they belong there, not here. This story should
**not** paper over a collision by reverting the fork count — file the collision
as a 0019 story.
