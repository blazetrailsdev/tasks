---
title: "Live::Buffer#write does not wait on a full SizedQueue, so an overfilling action never sees ClientDisconnected"
status: draft
updated: 2026-10-11
rfc: "0141-actionpack-surfaced-deviations"
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
closed-reason: null
---

## Context

`ActionDispatch::Response::Buffer#write`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:123-131`)
ends in `@buf.push string`. For `ActionController::Live::Buffer` `@buf` is a
`SizedQueue` (`action_controller/metal/live.rb:236-238`, `build_queue`), so a
write to a full queue blocks the controller thread until the reader pops, and
`Live::Buffer#write` (`live.rb:159-176`) checks `connected?` only after that
push returns. A reader that aborts the body therefore makes the blocked write
raise `ClientDisconnected`, which `Live#process` routes to `on_error`
(`live.rb:288-303`).

In trails `ResponseBuffer#write`
(`packages/actionpack/src/action-dispatch/http/response.ts`, `write`) and
`Buffer#write` (`packages/actionpack/src/action-controller/metal/live.ts`) are
synchronous. `SizedQueue#push` (`packages/ruby-compat/src/queue.ts`) answers a
promise when the queue is full, and `write` drops it: the write is held on the
push queue and the action runs on. An action that overfills the buffer never
waits, so it never sees the disconnect and never reaches `on_error`.

`test_abort_with_full_buffer`
(`vendor/rails/v8.0.2/actionpack/test/controller/live_stream_test.rb:466-493`)
turns on exactly this and is parked `it.skip` in
`packages/actionpack/src/action-controller/controller/live-stream.test.ts`
with `BLOCKED:` naming this story.

## Acceptance criteria

- A `Live::Buffer#write` to a full queue waits for the push, and the
  `connected?` check runs after it, as `live.rb:159-176` orders them. The
  callers that write to a live stream (`writeln`, `SSE#write`, `send_stream`
  blocks, `Live::Response#build_buffer`) await it.
- `abort with full buffer` in `controller/live-stream.test.ts` is unskipped
  and passes with its Rails body.
