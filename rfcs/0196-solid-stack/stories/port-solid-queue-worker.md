---
title: "Port SolidQueue::Worker (poll, claim and perform ready executions)"
status: in-progress
updated: 2026-10-23
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: ["port-solid-queue-adapter-and-models", "port-activejob-execution"]
deps-rfc: []
est-loc: 450
pr: trails#9273
claim: "2026-10-23T02:10:17Z"
assignee: "port-solid-queue-worker"
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/lib/solid_queue/worker.rb` and its `processes/` mixins (`poller`, `runnable`, `registrable`, `interruptible`) claim `ReadyExecution` rows and perform them through a thread pool.

Fork versus worker threads (the RFC's open question) is decided in
`port-solid-queue-supervisor`; this story runs the process in-process and
does not fork.

## Acceptance criteria

- Ported at its Rails name with methods in Rails order; its gem tests run on
  all three AR adapters.
- A job enqueued through the adapter is performed by a running worker.
