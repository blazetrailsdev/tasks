---
title: "response-body-setter-awaits-live-build-buffer-writes"
status: draft
updated: 2026-11-17
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

`Live::Response#build_buffer` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb:269-273`) writes each part with `buf.write part`, which blocks the caller of `response.body =` (`action_dispatch/http/response.rb:337-346`) until the queue drains, so a `ClientDisconnected` reaches that caller. trails' `buildBuffer` (`packages/actionpack/lib/action-controller/metal/live.ts`) now runs those writes on a ruby-compat `Thread`, so nothing is dropped, but the raise is reported on that thread and does not reach the caller. The reason is that `body =` is a synchronous setter, reached from `Metal#responseBody=` (`metal.ts`), `render` (`abstract-controller/rendering.ts:63`), `head`, `redirect_to` and http-authentication.

## Acceptance criteria

- Add `setBody()` (the setX idiom for an async setter) on `ActionDispatch::Response` and `setResponseBody()` on the controller, and converge every `response_body=` caller onto them, so `build_buffer`'s writes are awaited by the caller.
- A `ClientDisconnected` from a body with more parts than `queue_size` reaches the caller of `setBody`.
