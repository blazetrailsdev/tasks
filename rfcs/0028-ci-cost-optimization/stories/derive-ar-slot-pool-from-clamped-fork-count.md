---
title: "Derive the AR advisory slot pool from the clamped effective fork count"
status: claimed
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-24T01:07:13Z"
assignee: "derive-ar-slot-pool-from-clamped-fork-count"
blocked-by: null
closed-reason: null
---

## Context

PR #5185 aligned CI's `AR_DB_FORKS` (3 jobs in `.github/workflows/ci.yml`:
postgres-tests, mysql-tests, maria-tests) with the fork count vitest actually
runs, by hardcoding `"3"` — `numCpus - 1` on the current 4-vCPU runner.

That fixes today's drift but leaves the coupling manual and runner-shape
dependent. Two independent places consume the env var:

- `vitest.config.ts:83-95` computes `TEST_FORKS = min(TRAILS_TEST_FORKS ??
AR_DB_FORKS ?? 6, os.availableParallelism() - 1)` — the clamp is the real
  worker count.
- `packages/activerecord/src/test-helpers/ar-db-slots.ts:36-53`
  (`workerForkCount` / `slotPoolSize`) reads the RAW `AR_DB_FORKS` and sizes
  the advisory slot-DB pool at `forks + SLOT_HEADROOM` (2).

So the slot pool tracks the _requested_ count, not the _effective_ one. If the
GitHub runner image changes vCPU count (2-vCPU → 4-vCPU already happened once
in this RFC's history), the hardcoded `3` silently becomes wrong again: too
high and the pool over-provisions dead slot DBs, too low and it under-provisions
relative to workers that actually start.

The durable fix is to have the slot pool derive from the same clamped
host-aware value the config computes, so the workflow env var need not encode
the runner's core count at all.

## Acceptance criteria

- [ ] `slotPoolSize()` sizes from the effective (host-clamped) worker count
      rather than the raw `AR_DB_FORKS`, e.g. by applying the same
      `min(requested, availableParallelism() - 1)` clamp `vitest.config.ts`
      uses, sharing one helper rather than duplicating the expression.
- [ ] `AR_DB_SLOTS` override precedence and the `workers + 1` floor are
      preserved.
- [ ] Slot provisioning stays correct if the CI runner's vCPU count changes
      without any workflow edit; the three workflow jobs no longer need to
      encode `numCpus - 1` themselves (drop the value or keep it purely as an
      upper request).
- [ ] Comments in `vitest.config.ts` and `ar-db-slots.ts` describing the
      requested-vs-effective distinction updated to match.
