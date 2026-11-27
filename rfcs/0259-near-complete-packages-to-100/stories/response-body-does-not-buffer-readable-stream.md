---
title: "response-body-does-not-buffer-readable-stream"
status: in-progress
updated: 2026-11-27
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10825
claim: "2026-11-27T00:14:41Z"
assignee: "response-body-does-not-buffer-readable-stream"
blocked-by: null
closed-reason: null
---

## Context

Split from `response-body-does-not-buffer-enumerator`, which converged the
`each` arm of `Response#setBody`
(`packages/actionpack/lib/action-dispatch/http/response.ts`) onto Rails'
`body=` (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/http/response.rb:371-384`).
An `each` body is now stored as `@stream` unchanged. RackBody's async
iterator drives its `each`. The integration harness drains a streamed body
before rack-test reads it (`testing/integration.ts`).

One arm is still invented: `rbObjRespondTo(body, "toAry") || body instanceof ReadableStream`.
A `ReadableStream` is still wrapped in `Buffer`. Rails would store a body that
is neither `to_str`, `to_path` nor `to_ary` unchanged. Three places still need
the wrapper:

- `Buffer#each` / `eachChunk` / `abort` hold the stream's reader, so
  `RackBody#close` → `Response#abort` cancels a read that is parked
  (`readable-stream-body.trails.test.ts`, "is cancelled by the rack body's
  close while a read is parked", and the `Rackup::Handler::Node` disconnect
  test).
- `Buffer#awaitBody` (`test-case.ts:433`, `integration.ts`) lets
  `ActionController::TestCase` read the stream as a string ("is read by
  ActionController::TestCase as a string").

## Acceptance criteria

- [ ] `setBody` buffers only `to_str` / `to_ary`. A `ReadableStream` is
      stored unchanged.
- [ ] The three `readable-stream-body.trails.test.ts` tests pass. Cancel on
      close works without `Buffer`'s reader slot.
- [ ] `Buffer` loses its `_reader` and `ReadableStream` arms.
