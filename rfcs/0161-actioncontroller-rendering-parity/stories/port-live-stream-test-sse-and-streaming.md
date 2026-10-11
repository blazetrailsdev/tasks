---
title: "Port live_stream_test.rb's SSE, stream-write and send_stream tests (lines 1-527)"
status: in-progress
updated: 2026-10-11
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  ["port-actionpack-abstract-unit-test-support", "live-buffer-queue-is-not-a-blocking-sized-queue"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8779
claim: "2026-10-11T14:21:34Z"
assignee: "port-live-stream-test-sse-and-streaming"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/live_stream_test.rb` (735 lines,
37 tests) has no trails file at `controller/live-stream.test.ts`. (`pnpm parity:test`
reports `render text` as misplaced in `controller/base.test.ts`; that is a
trails-only test with a colliding name, not a port.) This story takes:

- `SSETest` (`:11-112`), 5 tests: `ActionController::Live::SSE` event, id,
  retry and multi-line writes
- `LiveStreamTest` (`:113-665`) up to `test_infinite_test_buffer` (`:473`),
  10 tests (`:369-476`): `set_cookie`, `write_to_stream`,
  `write_lines_to_stream`, the six `send_stream` tests (instrumentation,
  options and three content-type arms),
  `delayed_autoload_after_write_within_interlock_hook` and
  `infinite_test_buffer`

The three tests driven from a second thread through a
`Concurrent::CountDownLatch` (`async_stream`, `abort_with_full_buffer`,
`ignore_client_disconnect`, `:454-527`) are
`port-live-stream-test-latch-driven-tests`: with them the port did not fit one
PR.

`Live` runs the action in a new thread in Rails (`metal/live.rb:377-392`,
`new_controller_thread`); trails' analogue is
`withExecutionContext`, not `IsolatedExecutionState.run`.

## Acceptance criteria

- `controller/live-stream.test.ts` ports the tests above in Rails order under
  `SSETest` and `LiveStreamTest`.
- `TestController` carries the actions these tests reach; the remaining
  actions arrive with the stories whose tests call them.
