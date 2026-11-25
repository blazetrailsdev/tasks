---
title: "Response#body= tests respond_to?(:to_str), not typeof string"
status: draft
updated: 2026-11-25
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Response#body=`
(`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/http/response.rb:371-385`)
starts with `if body.respond_to?(:to_str)`, then `@stream = build_buffer(self, [body])`.
trails' `setBody` (`packages/actionpack/lib/action-dispatch/http/response.ts`,
`async setBody`) tests `typeof body === "string" || body instanceof Uint8Array`
instead. So a `SafeBuffer`, which answers `toStr`, falls through to the last
arm, `this.stream = body`, and a `response.body = htmlSafe(...)` hands Rack a
non-array object. trails#10730 removed Rack's `String(part)` coercions, so that
path now reaches `Buffer.byteLength` / `Digest#update` with an object.

## Acceptance criteria

- `setBody`'s first arm is `rbObjRespondTo(body, "toStr")`, as `response.rb:374`
  has it, and it buffers a primitive string (`[String(body)]`, which matches
  `Metal#setResponseBody`).
- A test sets `response.body` to a `SafeBuffer` and checks that `toAry()` holds
  a primitive string.
