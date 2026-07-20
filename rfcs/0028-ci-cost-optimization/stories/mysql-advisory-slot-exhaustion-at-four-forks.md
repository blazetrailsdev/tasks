---
title: "MySQL advisory GET_LOCK slots exhaust at AR_DB_FORKS=4, failing ~34 suites at setup"
status: ready
updated: 2026-07-20
rfc: "0028-ci-cost-optimization"
cluster: null
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

Running any sizeable MySQL slice with `AR_DB_FORKS=4` fails ~34 of 41 suites at
setup with:

```text
Error: acquireAdvisorySlotMysql: all 6 GET_LOCK slots are held after 20
attempts (5s). Increase AR_DB_SLOTS or check for stuck workers.
```

Confirmed **pre-existing on origin/main** during PR #4977 (baseline: 34 failed /
6 passed, identical error), on a freshly restarted, otherwise-idle MySQL
container — so it is not cross-worktree contention and not stuck workers. Four
forks should fit in six slots, which suggests each worker acquires more than one
slot, or slots are not released between files.

The failure mode is expensive to diagnose because it is suite-level with **zero
failing assertions**, which is indistinguishable at a glance from a real
regression breaking schema setup — it cost real time on #4977 before the
baseline disproved it.

## Acceptance criteria

- [ ] Root-cause why 4 forks exhaust 6 slots: count acquisitions per worker and
      check the release path on suite teardown / worker exit.
- [ ] `pnpm vitest run` over the MySQL adapter dirs at the CI fork count passes
      locally against a clean container.
- [ ] If the real constraint is that slots must exceed forks, make that
      relationship explicit (derive `AR_DB_SLOTS` from `AR_DB_FORKS`, or fail
      fast at startup with a message naming both numbers) rather than surfacing
      as 34 opaque suite errors.
