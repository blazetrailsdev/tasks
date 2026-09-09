---
title: "Port ActionView::LogSubscriber"
status: in-progress
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 250
priority: 30
pr: 7643
claim: "2026-09-09T13:36:21Z"
assignee: "collection-caching-for-partial-renderer"
blocked-by: null
closed-reason: null
---

## Context

`log_subscriber.rb` (12 methods) is absent. It is what turns the
`render_template.action_view` / `render_partial.action_view` /
`render_collection.action_view` / `render_layout.action_view` notifications into
the `Rendered posts/_post.html.erb (Duration: 0.1ms | Allocations: 62)` lines a
Rails log shows, plus `log_rendering_start` and the
`ActionView::Base.logger` seam.

It is in this slice rather than deferred because it is the consumer that proves
the instrumentation is actually emitted — `actionview-instrumentation` (RFC
0104, ready) is the producer half, and a producer with no subscriber is
untested surface.

Depends on the instrumentation story landing first; claim it after.

## Converged shape

`packages/actionview/src/log-subscriber.ts`, attached at Rails' site, with the
`Rendered` / `Rendering` message formats byte-identical to Rails' — they are
assertion targets in actionpack's tests, not cosmetic.

## Acceptance criteria

- `log_subscriber.rb` reports 0 missing in
  `pnpm parity:api --package actionview`.
- A template render emits one `Rendering` line and one `Rendered` line, in that
  order, with Rails' exact wording.
- `rebind_attributes` / the `:identifier` -> `from_rails_root` path shortening
  matches Rails, so a log line names `app/views/...` and not an absolute path.
