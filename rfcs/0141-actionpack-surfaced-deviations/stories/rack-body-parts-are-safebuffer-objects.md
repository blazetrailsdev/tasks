---
title: "rack-body-parts-are-safebuffer-objects"
status: done
updated: 2026-11-25
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10730
claim: "2026-11-25T01:17:24Z"
assignee: "flash-reader-is-a-hand-written-getter-not-a-delegate-call"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::OutputBuffer` / `ActionDispatch::Response` hand Rack a body whose parts are
`ActiveSupport::SafeBuffer` objects (`packages/activesupport/lib/core-ext/string/output-safety.ts`).
In Ruby a SafeBuffer is a String, so `Rack::ETag#digest_body` (`vendor/rack/v3.2.8/lib/rack/etag.rb:62-66`),
`Rack::ContentLength#call` (`content_length.rb:28`, `body.sum(&:bytesize)`) and `Rack::Response#initialize`
(`response.rb`) read it as one. In trails it is an object, so `packages/rack/lib/etag.ts` `digestBody`,
`content-length.ts` and `response.ts` each coerce a non-`Uint8Array` part with `String(part)`, receipted
`@inventedArm if — CONVERGEABLE rack-body-parts-are-safebuffer-objects` (trails#10460).

## Acceptance criteria

- A rendered response body that reaches Rack holds string primitives (or `Uint8Array`) only, e.g. the
  response buffer / `RackBody#toAry` answers primitive strings, as a Ruby String part is.
- The three `String(part)` coercions and their receipts are deleted; `digest << part` and
  `bytesize` are called on the part directly.
- turbo `frame-request-controller.test.ts` "frame requests get a unique etag" still passes.
