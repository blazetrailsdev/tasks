---
title: "Port SolidQueue::Supervisor and decide fork versus worker threads"
status: ready
updated: 2026-10-22
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps:
  [
    "port-solid-queue-worker",
    "port-solid-queue-dispatcher",
    "port-solid-queue-scheduler-and-recurring-tasks",
  ]
deps-rfc: []
est-loc: 500
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/lib/solid_queue/supervisor.rb` forks one process
per configured worker, dispatcher and scheduler, and `async` mode runs them as
threads. Node's `child_process.fork` starts a fresh interpreter and does not
copy the parent's heap (CLAUDE.md, "Runtime facts Node does not expose"). This
story owns the RFC's open question.

## Acceptance criteria

- The fork-versus-threads decision is recorded in the RFC README, replacing
  the open question, with the reason.
- `Supervisor` and the `bin/jobs` entry point are ported; a supervised app
  performs enqueued, scheduled and recurring jobs.
