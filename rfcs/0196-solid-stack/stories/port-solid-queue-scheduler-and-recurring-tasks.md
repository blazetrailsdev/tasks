---
title: "Port SolidQueue::Scheduler and recurring tasks"
status: claimed
updated: 2026-10-23
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps:
  - port-solid-queue-worker
  - vendor-and-port-fugit-cron
deps-rfc: []
est-loc: 450
pr: null
claim: "2026-10-23T18:51:11Z"
assignee: "port-solid-queue-dispatcher"
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/lib/solid_queue/scheduler.rb` enqueues `RecurringTask` rows (`app/models/solid_queue/recurring_task.rb`, from `config/recurring.yml`) on their schedules.

Fork versus worker threads (the RFC's open question) is decided in
`port-solid-queue-supervisor`; this story runs the process in-process and
does not fork.

## Acceptance criteria

- Ported at its Rails name with methods in Rails order; its gem tests run on
  all three AR adapters.
- Recurring tasks from config are enqueued on schedule.
