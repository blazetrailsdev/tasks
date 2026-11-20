---
title: "rack-etag-digests-to-ary-response-bodies"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
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

`vendor/rack/v3.2.8/lib/rack/etag.rb:31-37` digests any body that
`respond_to?(:to_ary)`, reassigning `body = body.to_ary` with no type check and
iterating it with `each` (`digest_body`, `:62-73`). `packages/rack/lib/etag.ts`
digests only a native `Array`, so an `ActionDispatch::Response::RackBody` never
gets an ETag. Converging naively breaks the app: `Response::Buffer#toAry`
(`packages/actionpack/lib/action-dispatch/http/response.ts:95-100`) answers
`eachChunk()` or `each()` (not an Array) for a stream / non-array buf, so a
`rbCheckArrayType` conversion raises `TypeError` and every request 500s
(trails#10451 CI).

`commands/middleware_test.rb` "conditional get + etag middlewares handle http
caching based on body" is parked `BLOCKED:` on this story in
`packages/trailties/test/commands/middleware.test.ts`.

## Acceptance criteria

- [ ] `ETag#call` mirrors etag.rb:31-37: `respond_to?(:to_ary)` guard, `body = body.to_ary`, `digest_body` iterating with `each`, `response[2] = body`.
- [ ] `RackBody#to_ary` / `Buffer#to_ary` answer what Rails' do for an Array buf, so a rendered response digests.
- [ ] The parked middleware test runs and passes; boot-app and routing tests stay green.
