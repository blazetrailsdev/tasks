---
title: "Live#send_stream instruments send_stream.action_controller and tests a Ruby Symbol type"
status: draft
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8645. Rails' `ActionController::Live#send_stream`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/live.rb:355-370`)
builds `payload = { filename:, disposition:, type: }` and runs its whole body
inside `ActiveSupport::Notifications.instrument("send_stream.action_controller", payload)`.

trails' `sendStream` (`packages/actionpack/src/action-controller/metal/live.ts:255`)
makes no `instrument` call at all, so no `send_stream.action_controller` event
fires. It also tests `typeof type === "symbol"` and reads `type.description`,
where a Ruby Symbol is a colon-prefixed string in trails (`type.is_a?(Symbol) ? Mime[type].to_s : type`, `live.rb:359`).

Nothing tracks the omission any more. The `send_stream` / `instrument` row in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/live.json`
went stale and was deleted in trails#8645, when an unrelated invented
`Notifier#instrument` interface left `metal/instrumentation.ts`; the call gate
stopped flagging the pair although the body still omits the call.

## Acceptance criteria

- `sendStream` builds Rails' `payload` and runs its header writes and the yield
  inside `Notifications.instrument("send_stream.action_controller", payload, ...)`,
  with the `ensure response.stream.close` outside it as in `live.rb:368-369`.
- The `type` arm tests a Ruby Symbol the trails way (`isSymbol`), not a JS `symbol`.
- A test subscribes to `send_stream.action_controller` and asserts the payload.
