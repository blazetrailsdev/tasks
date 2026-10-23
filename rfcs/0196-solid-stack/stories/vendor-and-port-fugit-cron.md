---
title: "Vendor and port the fugit cron parser for SolidQueue::RecurringTask"
status: draft
updated: 2026-10-23
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::RecurringTask` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/recurring_task.rb:1-3`)
does `require "fugit"`. `parsed_schedule` is `Fugit.parse(schedule)` (`:159-161`), and
`supported_schedule` checks it is a `Fugit::Cron` (`:111-115`). `next_time` / `previous_time`
(`:52-58`) call `Fugit::Cron#next_time` / `#previous_time`, and `to_s` reads `#original` (`:101`).
`Scheduler::RecurringSchedule#schedule` (`lib/solid_queue/scheduler/recurring_schedule.rb:53-71`)
builds on `delay_from_now` / `next_time`.

fugit is not vendored (`vendor/sources.lock.json` has no entry) and has no trails port. The hard
rules forbid a new third-party runtime dependency, so `port-solid-queue-scheduler-and-recurring-tasks`
cannot land a faithful `RecurringTask` without it.

## Acceptance criteria

- fugit is vendored at the version solid_queue 1.1.3 resolves (with et-orbi if it is needed),
  following `vendor/README.md`.
- `Fugit.parse`, `Fugit::Cron` (`next_time`, `previous_time`, `original`) and the natural-language
  forms solid_queue's tests use (`every hour`, `every second`) are ported at their Ruby names,
  with their gem tests for those methods.
