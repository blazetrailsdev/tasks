---
title: "Shard PG/MariaDB AR suites 2-way with vitest --shard on free hosted jobs"
status: claimed
updated: 2026-07-04
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: null
claim: "2026-07-04T13:04:30Z"
assignee: "shard-ar-adapter-suites"
blocked-by: null
closed-reason: null
---

## Context

The AR adapter suites are the CI critical path: on green main run 28704587770
(2026-07-04) the PostgreSQL job took 15m29s (855s of it the single
`pnpm vitest run packages/activerecord/` step, `.github/workflows/ci.yml`
postgres-tests job), MariaDB 12m44s (685s vitest), SQLite 7m44s. Every other
job finishes in ≤4 min, so time-to-green ≈ the PG lane. Job overhead is
already tight (install ~8s, cache-build makes `pnpm build` 6–45s), and the
PR #4528 DDL re-profile shows DDL is no longer the dominant cost outside PG
referential integrity — the residual vitest time is test execution, so the
remaining wall-time lever is parallelism.

vitest supports `--shard=i/n` (file-level sharding). RFC 0028's rejected
dimensions were **paid larger runners / self-hosted** and **adapter sampling**
— sharding across additional _free hosted_ jobs respects both rejections and
was never evaluated. Public-repo hosted parallelism is free; the PR
concurrency guard already cancels superseded runs, bounding pool cost.

Mechanism: turn `postgres-tests` and `maria-tests` into 2-way matrix jobs
(`strategy.matrix.shard: [1, 2]`, step arg `--shard=${{ matrix.shard }}/2`),
each matrix leg with its own service container (each leg gets a fresh
container automatically). The `ci` aggregator's `needs`/skip-allowlist and the
job-timing report must handle the matrix job names ("Active Record PostgreSQL
Tests (1)" etc.). The `activerecord-cli` step should run on one shard only
(or move out per the CLI-dedup quick win). DDL_PROFILE artifact names (PR #4528
wiring) must stay unique per shard if that measurement branch is ever
rebased.

Expected impact: PG lane 929s → ~500s, MariaDB 764s → ~430s; roughly 40–45%
off time-to-green.

## Acceptance criteria

- `postgres-tests` and `maria-tests` run as 2-way `--shard` matrices; full
  file coverage across shards (no file skipped or double-run — verify test
  counts sum to the unsharded count).
- `ci` aggregate job fails/skip-allowlists the matrix legs correctly.
- RFC 0028 measurement protocol applied: median time-to-green before/after on
  ≥5 runs; merge only on measured improvement, close if none (wall-time merge
  bar).
- sqlite-tests left unsharded (not on the critical path).
