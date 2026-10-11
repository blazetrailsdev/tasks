---
title: "Port live_stream_test.rb's three CountDownLatch-driven tests (async_stream, abort_with_full_buffer, ignore_client_disconnect)"
status: draft
updated: 2026-10-11
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-live-stream-test-sse-and-streaming` ported `SSETest` and the
`LiveStreamTest` tests up to `test_infinite_test_buffer` into
`packages/actionpack/src/action-controller/controller/live-stream.test.ts`,
and left out the three that drive the action from a second thread through a
`Concurrent::CountDownLatch`, to stay inside the PR size ceiling
(`vendor/rails/v8.0.2/actionpack/test/controller/live_stream_test.rb`):

- `test_async_stream` (`:454-471`), action `blocking_stream` (`:192-199`)
- `test_abort_with_full_buffer` (`:478-504`), action
  `overfill_buffer_and_die` (`:291-314`)
- `test_ignore_client_disconnect` (`:506-527`), action
  `ignore_client_disconnect` (`:323-336`)

They also need `capture_log_output` (`:346-355`) and the controller's
`latch` / `error_latch` accessors (`:124`).

What a first pass at them found:

- trails has no `Concurrent::CountDownLatch`. The only one in the repo is a
  test-local `countDownLatch()` in
  `packages/activerecord/src/adapters/abstract-mysql-adapter/transaction.test.ts`.
- `Thread.new(response) { |resp| ... }` has no argument slot in ruby-compat's
  `Thread` (`packages/ruby-compat/src/thread.ts`, the constructor takes the
  block alone), and `Thread#join` takes no timeout, so `t.join(3)` has nothing
  to pass.
- `Response#to_a` (`action_dispatch/http/response.rb:410-413`) is spelled
  `toRack` in `packages/actionpack/src/action-dispatch/http/response.ts`.
- With `resp.stream` read by `for await`, `async stream` and
  `ignore client disconnect` pass with their Rails bodies once the controller
  awaits the latch.
- `abort with full buffer` cannot pass until
  `live-buffer-write-does-not-wait-on-a-full-queue` lands: the action never
  waits on the full queue, so it never sees `ClientDisconnected` and
  `on_error` never runs.

## Acceptance criteria

- The three tests are ported into `controller/live-stream.test.ts` in Rails
  order, between `delayed autoload after write within interlock hook` and the
  tests from Rails line 528, with their actions on `TestController`.
- `abort with full buffer` runs if
  `live-buffer-write-does-not-wait-on-a-full-queue` has landed; otherwise it is
  parked `it.skip` under `BLOCKED: live-buffer-write-does-not-wait-on-a-full-queue`
  with its Rails body.
