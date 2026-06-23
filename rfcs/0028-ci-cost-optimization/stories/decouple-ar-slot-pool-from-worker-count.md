---
title: "Decouple AR advisory-slot pool from vitest worker count (add headroom)"
status: in-progress
updated: 2026-06-23
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3986
claim: "2026-06-23T12:27:45Z"
assignee: "decouple-ar-slot-pool-from-worker-count"
blocked-by: null
---

## Context

`AR_DB_FORKS` is consumed in two places: `vitest.config.ts:62` derives
`TEST_FORKS` (vitest `maxForks`, the worker count) from it, and
`packages/activerecord/src/test-setup-worker-db.ts:56,93` uses it as the
advisory-lock **slot pool size**. So the slot pool is exactly equal to the
worker count, with zero headroom.

Each worker holds its slot for its whole process lifetime and releases it only
on process exit (`test-setup-worker-db.ts:77` `process.on("exit", ...)`). When
vitest's fork pool recycles a worker between files, a replacement worker can
start and try to claim a slot before the outgoing process has exited and freed
its lock. With headroom (e.g. forks=8 → 8 slots) the transient overlap is
absorbed; with a tight pool it is not.

Measured in the tune-ar-db-forks-to-runner-cores sweep (PR #3870): forks=2
failed **deterministically in all 5 runs** with
`acquireAdvisorySlotPg: all 2 advisory lock slots are held after 20 attempts`
(bounded 5s retry, then throw — `test-setup-worker-db.ts:67-89`). This made
forks=2 (and `--maxWorkers`-derived auto = core count on a 2-vCPU runner)
non-viable, foreclosing the lowest-fork-count options the sweep wanted to test.

## Acceptance criteria

- [ ] Size the advisory-slot pool independently of the vitest worker count,
      with headroom over `maxForks` (e.g. `slots = workers + N`, or a separate
      `AR_DB_SLOTS` env), so a replacement worker recycling in always finds a
      free slot.
- [ ] forks=2 (and forks=1) run green deterministically across ≥5 reruns on the
      postgres AR job.
- [ ] Update the `vitest.config.ts:4-24` comment to reflect the decoupling once
      slots no longer equal workers.
- [ ] No regression at forks=8.

## Notes

This is the prerequisite that would let tune-ar-db-forks-to-runner-cores revisit
sub-8 fork counts; that story closed as a no-op (8 == 4 on wall-clock) partly
because 2 was non-viable. Pure test-infra change; no Rails parity surface.
