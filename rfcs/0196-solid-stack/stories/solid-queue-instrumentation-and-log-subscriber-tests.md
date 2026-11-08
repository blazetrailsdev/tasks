---
title: "Port solid-queue instrumentation_test and log_subscriber_test"
status: ready
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 450
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/test/integration/instrumentation_test.rb` (22 tests) and `test/unit/log_subscriber_test.rb` (6 tests) have no TS port on origin/main (parity:test 0/22 and 0/6). `packages/solid-queue/src/log-subscriber.ts` exists (port-solid-queue-log-subscriber), so the events and log lines these tests assert are partly in place. The events covered are dispatch_scheduled, claim, polling, release_claimed, start_process, register/deregister_process, prune_processes, fail_many_claimed, retry/retry_all, discard/discard_all, release_blocked/release_many_blocked, enqueue_recurring_task and thread_error.

## Acceptance criteria

- `integration/instrumentation.test.ts` and `log-subscriber.test.ts` port all 28 tests under their Rails names, and they pass.
- Every `*.solid_queue` event the tests assert is emitted with Rails' payload keys. A missing instrumentation call is added at its Rails site.
