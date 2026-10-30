---
title: "Configuration builds RecurringTask before its schema is loaded, so a real supervisor crashes"
status: in-progress
updated: 2026-10-30
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9491
claim: "2026-10-30T14:28:50Z"
assignee: "recurring-tasks-load-schema-before-construction"
blocked-by: null
closed-reason: null
---

In a booted application `bin/jobs` dies with `UnknownAttributeError: unknown
attribute 'key' for RecurringTask` as soon as config/recurring.yml has a task:
`Configuration` calls `RecurringTask.fromConfiguration` (`new`) before the
model's schema has loaded, and trails reflection is lazy and async. Rails loads
the schema synchronously on first attribute access
(solid_queue v1.1.3 lib/solid_queue/configuration.rb `recurring_tasks`,
app/models/solid_queue/recurring_task.rb `from_configuration`). trails' suite
misses it because tests load the schema first. Found by trailmap.

## Acceptance

- A supervisor started in a fresh process with a recurring.yml task boots, with a test.
