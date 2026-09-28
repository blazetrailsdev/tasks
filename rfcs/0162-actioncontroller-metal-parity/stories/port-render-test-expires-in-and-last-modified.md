---
title: "Port render_test.rb's TestController, ExpiresInRenderTest and LastModifiedRenderTest"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "port-actionpack-view-and-helper-test-fixtures",
    "model-response-cache-control-hash-for-expires-in-and-fresh-when",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb` (1158 lines,
88 tests) has no trails file at `controller/render.test.ts`. Despite its name,
80 of its tests exercise `ActionController::ConditionalGet`
(`action_controller/metal/conditional_get.rb`) and `Head`, which is why this RFC
owns it. This story takes the first two test classes and the `TestController`
they drive (`:1-373`):

- `ExpiresInRenderTest` (`:374-515`), 23 tests: `expires_in` with `public`,
  `must_revalidate`, `stale_while_revalidate`, `stale_if_error`, `immutable`,
  `expires_now`, and how they merge into `response.cache_control`
- `LastModifiedRenderTest` (`:516-666`), 21 tests: `fresh_when` / `stale?`
  with `last_modified`, `If-Modified-Since`, records and collections

Both depend on `expires_in` / `fresh_when` merging into one
`response.cache_control` hash (`conditional_get.rb:137-155,290-302`), which
`model-response-cache-control-hash-for-expires-in-and-fresh-when` (RFC 0141)
converges.

## Acceptance criteria

- `controller/render.test.ts` holds `TestController` and both classes, every
  test in Rails order.
- No test asserts today's composed `cache-control` string where Rails asserts
  the merged hash's output.
