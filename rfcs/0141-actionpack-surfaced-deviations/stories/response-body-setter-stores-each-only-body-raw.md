---
title: "response-body-setter-stores-each-only-body-raw"
status: draft
updated: 2026-11-23
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

Rails v8.0.5.2 `ActionDispatch::Response#body=`
(`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/http/response.rb:371-384`)
stores a body that answers neither `to_str`, `to_path` nor `to_ary` as `@stream`
directly. trails' `Response#setBody`
(`packages/actionpack/lib/action-dispatch/http/response.ts`) still routes an
`each`-only body (`ActionView::StreamingTemplateRenderer::Body`) and a
`ReadableStream` through `buildBuffer`, because rack-test's `MockResponse`
(`packages/rack/lib/mock-response.ts`, `bufferedBodyBang` in the constructor)
reads its body synchronously and cannot drain the async `Body#each`.

## Acceptance criteria

- [ ] `MockResponse` (or `Rack::Test::Session#process_request`) drains an async body before buffering, as the Ruby thread would.
- [ ] `setBody`'s final arm stores the body raw, as Rails does, and the `@inventedArm` receipt is removed.
- [ ] `render-streaming.test.ts` and `live-stream.test.ts` stay green.
