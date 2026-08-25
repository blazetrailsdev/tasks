---
title: "remeasure-slot-1-purge-flip-on-mysql"
status: closed
updated: 2026-08-08
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do on RFC closure: 0028-ci-cost-optimization is being closed at 71/77 and no other RFC owns CI timing measurement. The re-measurement of the #5710 slot-1 purge flip (ownsSlotDatabase(), config.ts:174 / test-setup-worker-db.ts:172-178) on PG and MySQL was never run; the prior local A/B stands as the only evidence. Refile against a CI-cost successor RFC if worker-DB setup time regresses."
---

# Re-measure (and consider reverting) the slot-1 purge flip on the MySQL lane

## Context

`measure-slot-1-purge-path-timing-on-pg-and-mysql` A/B'd the #5710 flip
(`ownsSlotDatabase()` in `packages/activerecord/src/support/config.ts:174`,
consumed at `packages/activerecord/src/test-setup-worker-db.ts:172-178`)
locally against an isolated PG 17 / MySQL 8 compose project, `TRAILS_TEST_FORKS=3`
(slot 1 claimed), a fixed 24-file set
(`find packages/activerecord/src/associations -maxdepth 1 -name '*.test.ts' | sort | head -24`),
3 alternating reps per arm. Arms: `after` = main
(`slotNumber(read) > 1 || present(read, RUN_TOKEN_ENV) !== undefined`),
`before` = the pre-#5710 gate (`slotNumber(read) > 1`).

Wall clock, seconds (median of 3):

| lane  | before | after | delta |
| ----- | ------ | ----- | ----- |
| PG    | 64.96  | 64.84 | −0.1  |
| MySQL | 77.87  | 79.86 | +2.0  |

PG is inside noise (arms interleave run to run). MySQL is **not**: all three
`after` reps (78.67 / 79.86 / 80.46) are slower than all three `before` reps
(75.76 / 77.87 / 78.45), and vitest's own `setup` total moves the same way
(71.5 → 73.1). That is ~2.5% of the job for one worker in three — small, but
consistent in direction, i.e. the MySQL purge (`reconstructFromSchema`, drop +
create database) looks slightly _more_ expensive than dropping the tables in
place for slot 1.

CI wall clock could not be used as the source: GitHub run retention on `main`
only reaches 2026-07-31T19:00Z, after #5710 merged (2026-07-31T15:39Z), so
there are no pre-flip runs left to compare.

## Acceptance criteria

- Reproduce the MySQL delta with more reps (n >= 7) and at CI's fork count, not
  3, on a file set closer to the real job — the effect is small enough that
  fork count and file mix could flip its sign.
- If it holds, gate the exclusive-database flag on the lane
  (`AR_MYSQL_EXCLUSIVE_DB` back to `slot > 1`, `AR_PG_EXCLUSIVE_DB` left as
  #5710 set it) rather than reverting #5710 wholesale — the PG half is not a
  regression and the bootstrap-connection change #5710 also carried is
  correctness, not perf.
- If it does not hold, close this out by recording the larger-n numbers.
