---
title: "Live::Response#build_buffer drops Live::Buffer#write promises"
status: draft
updated: 2026-11-13
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10054 made `Live::Buffer#write` async: it awaits the `SizedQueue` push and then checks `connected?`, in the order of `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb:180-198`. One caller still drops the promise. `Live::Response#build_buffer` (`packages/actionpack/lib/action-controller/metal/live.ts`, `buildBuffer`; Rails `live.rb` `Live::Response#build_buffer`) writes each body part with `each(body, (part) => buf.write(part))` from the synchronous `response.body =` path (`ActionDispatch::Response#body=`, `response.ts`).

In Ruby, a part pushed into a full queue blocks the caller until a reader pops it. A `ClientDisconnected` raised by that write reaches the caller of `response.body =`. In trails, when the body has more parts than `Live::Buffer.queue_size`, the extra writes are left pending. If the client then disconnects, each pending write rejects with no handler, so the rejection is unhandled and never reaches the caller.

## Acceptance criteria

- No `Live::Buffer#write` promise is dropped on the `response.body =` → `build_buffer` path. Either `build_buffer` returns the writes to a caller that awaits them, or the setter path is made awaitable, following the settled `setX()` idiom for async setters.
- A test sets a body with more parts than `queue_size`, disconnects the client, and asserts that the `ClientDisconnected` reaches the caller and no unhandled rejection occurs.
