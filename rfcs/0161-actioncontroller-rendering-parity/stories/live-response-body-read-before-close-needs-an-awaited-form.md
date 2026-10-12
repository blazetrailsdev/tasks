---
title: "A live response body read before the stream closes raises; replace the test-local waitForStreamClose"
status: ready
updated: 2026-10-12
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

`LiveStreamTest#setup` (`vendor/rails/v8.0.2/actionpack/test/controller/live_stream_test.rb:356-366`)
restores the real `new_controller_thread`, so `get` returns once the response
commits while the action is still running on the live thread
(`action_controller/metal/live.rb:278-322`). The tests then read
`response.body`, which in Rails blocks in `Live::Buffer#each_chunk`'s
`@buf.pop` (`live.rb:237-246`) until the action closes the stream.

In trails `Live::Buffer#each`
(`packages/actionpack/src/action-controller/metal/live.ts`, tagged
`@noRailsEquivalent PERMANENT`) pops without blocking, so a body read before
the close raises `ThreadError: queue empty` and discards the chunks already
popped. trails#8783 worked around it in the test with an invented
`LiveStreamTest#waitForStreamClose` (`vi.waitUntil(() => stream.isClosed)`),
called in four tests: `exception handling html`, `exception handling plain
text`, `exception callback when committed`,
`exceptions raised handling exceptions and committed`
(`packages/actionpack/src/action-controller/controller/live-stream.test.ts`).
`port-live-stream-test-latch-driven-tests` will need the same wait.

Related: `live-buffer-queue-is-not-a-blocking-sized-queue`,
`live-buffer-write-does-not-wait-on-a-full-queue`.

## Acceptance criteria

- The awaited read of a live response's body lives in the harness or the
  response, at a Rails name where one exists (`await_sent`,
  `response.rb:203-207`, is the closest: Rails' `sent!` follows the body being
  drained), not in a per-test-class helper.
- A body read that arrives before the stream closes does not lose the chunks it
  popped.
- `waitForStreamClose` is deleted from `live-stream.test.ts` and the four tests
  still pass with the real `newControllerThread`.
