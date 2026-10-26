---
title: "port-solid-queue-recurring-job"
status: in-progress
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9338
claim: "2026-10-26T17:35:59Z"
assignee: "port-solid-queue-recurring-job"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::RecurringJob` (`vendor/solid_queue/v1.1.3/app/jobs/solid_queue/recurring_job.rb`)
is `RecurringTask.default_job_class` (`app/models/solid_queue/recurring_task.rb:16-17`) and
performs `eval(command)`. trails has no eval pipeline, so it is unported; `RecurringTask.defaultJobClass`
is unset and a command-only task cannot enqueue. The Rails test
"task configured with a command" (`test/models/solid_queue/recurring_task_test.rb:166-171`)
is `it.skip` in `packages/solid-queue/src/recurring-task.test.ts`.

## Acceptance criteria

- Decide (owner ruling) how a `command:` recurring task runs without `eval`; port
  `RecurringJob` at its Rails name, seat `defaultJobClass`, and un-skip the test — or close
  PERMANENT if ruled unportable.
