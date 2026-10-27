---
title: "solid-queue lib classes are registered constants, not toString-named"
status: draft
updated: 2026-10-27
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

trails#9360 registered every `app/models/solid_queue/*` port under its Ruby
constant path with `registerModel(name, model)` / `registerConstant`. Eight
other solid-queue classes still name themselves with an invented
`static toString()` returning the Ruby path, and are not seated in the
constant table, so `rbModName` / `constantize` / `module_parents` do not see
them:

- `packages/solid-queue/src/pool.ts:14` (`SolidQueue::Pool`, `vendor/solid_queue/v1.1.3/lib/solid_queue/pool.rb`)
- `dispatcher/concurrency-maintenance.ts:9` (`SolidQueue::Dispatcher::ConcurrencyMaintenance`)
- `processes/base.ts:11` (`SolidQueue::Processes::Base`)
- `scheduler/recurring-schedule.ts:10` (`SolidQueue::Scheduler::RecurringSchedule`)
- `engine.ts:29` (`SolidQueue::Engine`)
- `recurring-job.ts:5` (`SolidQueue::RecurringJob`, already registered as well)
- `active-job/queue-adapters/solid-queue-adapter.ts:7` (`ActiveJob::QueueAdapters::SolidQueueAdapter`)
- `recurring-task/arguments.ts:6` (`SolidQueue::RecurringTask::Arguments`)

## Acceptance criteria

- Each class is seated with `registerConstant("<Ruby path>", Klass)` and its
  `static toString()` override is deleted, if `rbModName` / `inspect` already
  answer the registered path for a class (check the activejob logging path for
  `RecurringJob` / the adapter name).
- solid-queue tests stay green, and log output still prints the Ruby paths.
