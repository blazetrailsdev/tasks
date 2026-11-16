---
title: "solid_queue jobs_by_id readers keep Ruby Hash insertion order"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# jobs_by_id readers keep Ruby Hash insertion order

## Context

`successfully_dispatched`, `dispatched_and_ready` and `dispatched_and_blocked` (`vendor/solid_queue/v1.7.2/app/models/solid_queue/job/executable.rb:50-61`) and `successfully_scheduled` (`job/schedulable.rb:25-28`) build `jobs.index_by(&:id)` and read `jobs_by_id.keys`. A Ruby Hash keeps insertion order. The trails ports (`packages/solid-queue/lib/job/executable.ts`, `job/schedulable.ts`) use `indexBy` into a plain object and `Object.keys(...).map(Number)`, so integer keys come back in ascending order instead of insertion order.

## Acceptance criteria

- `jobs_by_id` keeps insertion order, either as a Map or by reading the keys in the source jobs' order, so the readers' `where(job_id: jobs_by_id.keys)` matches Ruby.
- A test asserts the order of `dispatch_all` / `schedule_all` results where Rails' order is observable.
