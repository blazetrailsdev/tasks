---
title: "Port queue_naming_test.rb and queue_priority_test.rb (20 cases)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-queue-name-and-priority",
    "port-activejob-enqueuing-and-configured-job",
    "port-activejob-test-fixture-jobs",
  ]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Both files mutate class-level configuration (`queue_as`, `queue_name_prefix`, `default_queue_name`, `queue_with_priority`) and restore it in an `ensure`; port each restore as a `finally`.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/queue_naming_test.rb`: 14 cases, as `parity:test` names them:

- [ ] `:15` QueueNamingTest — "name derived from base"
- [ ] `:19` QueueNamingTest — "uses given queue name job"
- [ ] `:30` QueueNamingTest — "allows a blank queue name"
- [ ] `:41` QueueNamingTest — "does not use a nil queue name"
- [ ] `:52` QueueNamingTest — "evals block given to queue_as to determine queue"
- [ ] `:63` QueueNamingTest — "can use arguments to determine queue_name in queue_as block"
- [ ] `:75` QueueNamingTest — "queue_name_prefix prepended to the queue name with default delimiter"
- [ ] `:89` QueueNamingTest — "queue_name_prefix prepended to the queue name with custom delimiter"
- [ ] `:106` QueueNamingTest — "using a custom default_queue_name"
- [ ] `:118` QueueNamingTest — "queue_name_prefix prepended to the default_queue_name"
- [ ] `:133` QueueNamingTest — "can change queue_name_prefix in a job class definition without affecting other jobs"
- [ ] `:138` QueueNamingTest — "can change queue_name_prefix in a job class without affecting other jobs"
- [ ] `:151` QueueNamingTest — "is assigned when perform_now"
- [ ] `:157` QueueNamingTest — "is assigned when perform_later"

`vendor/rails/v8.0.2/activejob/test/cases/queue_priority_test.rb`: 6 cases, as `parity:test` names them:

- [ ] `:12` QueuePriorityTest — "priority unset by default"
- [ ] `:16` QueuePriorityTest — "uses given priority"
- [ ] `:27` QueuePriorityTest — "evals block given to priority to determine priority"
- [ ] `:38` QueuePriorityTest — "can use arguments to determine priority in priority block"
- [ ] `:50` QueuePriorityTest — "is assigned when perform_now"
- [ ] `:56` QueuePriorityTest — "is assigned when perform_later"

## Acceptance criteria

- [ ] All 20 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
