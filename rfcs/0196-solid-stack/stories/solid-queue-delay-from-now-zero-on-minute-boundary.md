---
title: "solid-queue: RecurringTask#delayFromNow returns 0 on a minute boundary (flaky test)"
status: draft
updated: 2026-11-12
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/recurring-task.trails.test.ts:7` ("delayFromNow is seconds until the next cron tick") failed on trails#10002's CI run 43090303138 (MariaDB 3) with `expected 0 to be greater than 0`, then passed on rerun. Rails' `delay_from_now` is `[ (next_time - Time.current).to_f, 0 ].max` (`vendor/solid_queue/*/app/models/solid_queue/recurring_task.rb:50-52`), and `next_time` is `parsed_schedule.next_time.utc` (`:54-56`). Fugit's `next_time` is strictly after now, so the Ruby delay is a positive Float. Trails' version is `Math.max(Number(this.nextTime().minus(Time.current())), 0)` (`packages/solid-queue/lib/recurring-task.ts:96-98`). A result of exactly 0 means either `nextTime()` can equal or precede `Time.current()` on a minute boundary (a fugit/et-orbi port difference), or the subtraction loses the fractional seconds.

## Acceptance criteria

- Find why `delayFromNow()` can return 0 for `* * * * *`, and converge it on Rails: a strictly positive Float delay, because fugit's `next_time` is strictly after now.
- Add a deterministic test that freezes time on an exact minute boundary. The test must fail before the fix.
