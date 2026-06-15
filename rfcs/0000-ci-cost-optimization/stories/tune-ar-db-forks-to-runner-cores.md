---
title: "Right-size AR_DB_FORKS to the runner core count"
status: draft
updated: 2026-06-15
rfc: "0000-ci-cost-optimization"
cluster: parallelism-rounding
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
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
- [ ] Set `AR_DB_FORKS` to the measured-best value across `postgres-tests`,
      `maria-tests`, and `mysql-tests` (keep them consistent). If 8 turns out to
      be optimal, document that with the measurements and close as a no-op
      finding — the measurement is the deliverable.
- [ ] CI green; confirm the AR suites still pass deterministically at the new
      fork count (watch for newly-surfaced shared-table flakes — see
      `flake-elimination-as-ci-cost`).

## Savings & risk

- **Est. savings:** primarily **wall-clock / latency** on the two longest jobs;
  possibly ~1–2 billed job-min/run if the change crosses minute boundaries.
  Could be net-zero billed minutes if it only shifts wall-clock without crossing
  a boundary — that is still a throughput win under queue contention.
- **Risk:** low–medium. Fork count interacts with the shared-table flakes
  documented in repo memory; a different fork count can change test scheduling
  and surface (or hide) collisions. Validate across a few reruns before landing.

## Notes

Coordinate with whoever holds RFC 0019 (canonical-schema burndown): if fork
changes surface new collisions, they belong there, not here. This story should
**not** paper over a collision by reverting the fork count — file the collision
as a 0019 story.
