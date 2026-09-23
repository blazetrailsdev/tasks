---
title: "Shard the ARCONN=sqlite3_mem AR lane — the last unsharded one, now main's critical path"
status: draft
updated: 2026-09-23
rfc: "0157-ci-cost-round-2"
cluster: parallelism-rounding
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`sqlite-mem-tests` ("Active Record SQLite :memory: Tests",
`.github/workflows/ci.yml`) is now the **critical path on `main`**, and it is
the last unsharded AR lane.

Measured on green `main` run 35872727737 (2026-09-23):

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

Every other job finishes well inside it, so time-to-green on `main` ≈ this lane.

This is the same displacement `shard-ar-adapter-suites` (trails#4546) caused
twice already, and the `sqlite-tests` job comment in `ci.yml` names the pattern
explicitly:

> That story left this lane unsharded as "not on the critical path"; sharding
> the other two made it the critical path, so the exemption no longer holds.

`shard-ar-adapter-suites`' final acceptance criterion — "sqlite-tests left
unsharded (not on the critical path)" — has now been overtaken twice: once when
`sqlite-tests` was itself sharded, and again here.

**This lane is cheaper to shard than the other three.** It has no service
container to duplicate, exactly like `sqlite-tests`. Its whole body is a single
step:

```yaml
- run: pnpm vitest run packages/activerecord/
  env:
    ARCONN: sqlite3_mem
```

No `activerecord-cli` step, no `scripts/` step — the story comment records that
the CLI package is excluded because it owns no `inMemoryDb()` guards. So there
is nothing to pin to shard 1, which is the fiddly part of the other three.

**Scope note:** this lane does not run on most PRs — it is gated to `main`, the
Monday sweep, `workflow_dispatch`, and the `run-sqlite-mem` label (RFC 0029:
`ARCONN=sqlite3_mem` is the only lane where `in_memory_db?` is true). So the win
is on `main` time-to-green and on labelled PRs, not on the typical PR. It is in
the `ci` aggregator's `needs:`, so it does gate merges whenever it runs.

Expected: 789s → ~420s, putting the lane below the PG shards and handing the
critical path back to PostgreSQL at ~570s. That is ~3.5 min off `main`
time-to-green.

## Acceptance criteria

- [ ] `sqlite-mem-tests` runs as a 2-way `strategy.matrix.shard: [1, 2]` with
      `--shard=${{ matrix.shard }}/2`, mirroring the `sqlite-tests` job.
- [ ] `ARCONN: sqlite3_mem` is set on both legs.
- [ ] Full file coverage across shards: the test counts of the two legs sum to
      the unsharded count (no file skipped or double-run).
- [ ] The `ci` aggregator's `needs:` / skip-allowlist and the job-timing report
      handle the matrix leg names ("Active Record SQLite :memory: Tests (1)").
- [ ] `scripts/ci-suite-coverage.test.ts` still passes — this lane's gate
      reference is unchanged.
- [ ] The `run-sqlite-mem` label still opts both legs in, and the
      label's description (see `correct-run-sqlite-mem-label-description`)
      is still accurate.
- [ ] RFC 0028 measurement protocol: median `main` time-to-green before/after
      over >=5 runs; merge only on a measured improvement.
- [ ] The stale AC in `shard-ar-adapter-suites` ("sqlite-tests left unsharded")
      is noted as overtaken, so the next reader does not treat it as current.
