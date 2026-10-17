---
title: "Port SolidQueue::Dispatcher and concurrency maintenance"
status: draft
updated: 2026-10-17
rfc: "0000-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: ["port-solid-queue-worker"]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/lib/solid_queue/dispatcher.rb` moves due `ScheduledExecution` rows to ready and runs `Dispatcher::ConcurrencyMaintenance`.

Fork versus worker threads (the RFC's open question) is decided in
`port-solid-queue-supervisor`; this story runs the process in-process and
does not fork.

## Acceptance criteria

- Ported at its Rails name with methods in Rails order; its gem tests run on
  all three AR adapters.
- A job enqueued with `wait:` becomes ready and is performed after its time.
