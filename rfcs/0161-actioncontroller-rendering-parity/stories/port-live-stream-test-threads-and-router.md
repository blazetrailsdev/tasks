---
title: "Port live_stream_test.rb's thread-state, exception, thread, buffer and router tests"
status: draft
updated: 2026-09-27
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-live-stream-test-sse-and-streaming"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rest of `vendor/rails/v8.0.2/actionpack/test/controller/live_stream_test.rb`:

- `LiveStreamTest` from Rails line 528 to `:665` — 16 tests (`:529-655`):
  thread-local and `IsolatedExecutionState` copy and reset into the live
  thread, the default header, `render_text` (`:579`), four exception-handling
  arms before and after
  commit, `stale?` with and without an etag, and the buffer's `to_ary`
- `LiveControllerThreadTest` (`:666`, 1)
- `BufferTest` (`:690`, 1)
- `LiveStreamRouterTest < ActionDispatch::IntegrationTest` (`:698`, 1)

The thread tests pin `new_controller_thread` / `clean_up_thread_locals`
(`metal/live.rb:377-392`), whose TestCase overrides are
`test-case-missing-methods-and-arity` in RFC 0160 (test harness).

## Acceptance criteria

- The tests above are ported in Rails order; `controller/base.test.ts` is not
  edited.
- `pnpm parity:test --package actioncontroller` reports
  `controller/live_stream_test.rb` 37/37.
