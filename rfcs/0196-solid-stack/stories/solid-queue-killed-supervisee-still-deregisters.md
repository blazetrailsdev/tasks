---
title: "solid-queue-killed-supervisee-still-deregisters"
status: closed
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "duplicate of solid-queue-quit-supervisee-exits-like-exit-bang (same QUIT-kill-doesn't-stop-async-body cause); also covers term-supervisor-exceeding-timeout flake"
---

## Context

`ProcessesLifecycleTest > term supervisor exceeding timeout while there are jobs in-flight`
(`packages/solid-queue/test/integration/processes-lifecycle.test.ts`, Rails
`vendor/solid_queue/v1.1.3/test/integration/processes_lifecycle_test.rb:122-146`) races and
fails intermittently with `expected [] to deeply equal [ 'background' ]` at
`assertRegisteredWorkersFor(["background"])` (seen on trails#10179, PG shard 2). It was parked
as `it.skip` to unblock main.

Cause: on shutdown-timeout the supervisor QUITs forks; for an in-process supervisee
`Signals#signalProcess` calls `supervisee._thread.kill()` (`packages/solid-queue/lib/supervisor/signals.ts:87`).
ruby-compat `Thread#exit` cannot stop a running async body, so `Worker#shutdown`
(`packages/solid-queue/lib/worker.ts:70-74`) resumes after `pool.waitForTermination(shutdownTimeout)`
and the `after_shutdown :deregister` callback (`lib/processes/registrable.ts:32`) deregisters the
worker at ~shutdownTimeout+0.5s, the same instant the test asserts. In Rails the worker is a fork and
QUIT is `exit!` (`processes/supervised.rb`), so it never deregisters.

## Acceptance criteria

- A killed (QUIT) in-process supervisee runs no shutdown callbacks after the kill (no deregister),
  matching `exit!` in the fork; the guard is receipted `@inventedArm`.
- The `it.skip` is removed and the test passes consistently on all adapters.
