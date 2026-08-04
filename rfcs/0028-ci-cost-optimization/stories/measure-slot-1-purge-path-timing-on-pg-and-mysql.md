---
title: "Measure the slot-1 purge-path flip on the PG and MySQL lanes"
status: done
updated: 2026-08-04
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6088
claim: "2026-08-04T20:08:08Z"
assignee: "i18n-date-complete-frags-commercial-entry"
blocked-by: null
closed-reason: null
---

## Context

PR #5710 flipped the PG/MySQL slot-1 worker from the drop-tables-in-place setup
path to the purge (`reconstructFromSchema`) path, on the grounds that every slot
is a per-run, per-worker database once #5638 stamps the run token. The story that
carried it deliberately deferred the timing measurement: the change was verified
for _correctness_ on both lanes locally (`TRAILS_TEST_FORKS=3`, so slot 1 is
claimed), but nobody has measured what the flip is worth in CI wall clock.

Relevant code: `packages/activerecord/src/support/config.ts` (`ownsSlotDatabase`),
`packages/activerecord/src/test-setup-worker-db.ts:173-183`,
`packages/activerecord/src/test-setup-dy.ts:23-30`.

## Acceptance criteria

- Compare per-file setup cost for the slot-1 worker before and after #5710 on
  the PG and MySQL CI lanes (the two lanes the flag gates), reported as a
  wall-clock delta for the AR job.
- State whether the purge path is in fact the cheaper one for slot 1 at CI's
  fork count, or whether the win is inside noise — RFC 0028 decisions should
  rest on a number, not on the inference that slot 1 now resembles slots 2..N.
- If the flip turns out to be a regression on either lane, file the revert as
  its own story with the measurement attached.
