---
title: "Port solid-queue jobs_lifecycle, concurrency_controls, recurring_tasks and lifecycle_hooks integration tests"
status: ready
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 600
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These integration files have no TS port on origin/main (from `pnpm parity:test --package solid-queue --missing`):

- `integration/jobs_lifecycle_test.rb` (9): enqueue/run, retries, discard, scheduled, clearing finished jobs.
- `integration/concurrency_controls_test.rb` (8): `limits_concurrency` blocking, semaphore expiry, dispatcher unblocking.
- `integration/recurring_tasks_test.rb` (2) and `integration/lifecycle_hooks_test.rb` (2).

They run a real supervisor (threads, per the RFC's async-supervisor decision) against the queue database.

## Acceptance criteria

- `integration/{jobs-lifecycle,concurrency-controls,recurring-tasks,lifecycle-hooks}.test.ts` port all 21 tests under their Rails names, and they pass on all three adapter lanes.
- A source gap a test exposes is fixed. Where a test cannot run in Node (e.g. a fork), it is skipped with a reason that cites the RFC decision.
