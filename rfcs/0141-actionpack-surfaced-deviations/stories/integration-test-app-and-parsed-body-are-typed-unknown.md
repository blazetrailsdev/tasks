---
title: "integration-test-app-and-parsed-body-are-typed-unknown"
status: draft
updated: 2026-10-12
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

Split from `port-chunked-streaming-and-form-builder-tests`, which typed
`Response#stream` and left two members `unknown` because retyping them reaches
past that PR.

- `IntegrationTest#app` and `IntegrationTest.app`
  (`packages/actionpack/src/action-dispatch/testing/integration.ts`, the `_app`
  accessors) are typed `unknown`. Rails' `chunked_test.rb:22-26`
  (`vendor/rails/v8.0.2/actionpack/test/controller/chunked_test.rb`) is
  `@app = self.class.build_app` then `@app.routes.draw`, which
  `controller/chunked.test.ts` ports as `(t.app as RoutedRackApp).routes.draw`.
  The same cast is at `dispatch/routing-assertions.test.ts:588`,
  `test-helpers/abstract-unit.ts:163` and four sites in
  `action-dispatch/testing/assertions/routing.ts`. Typing the accessor
  `(RackApp | RackMiddleware) & { routes?: RouteSet }` was tried: it reds about
  twenty test classes that override `app` with a narrower or unrelated type
  (`controller/integration.test.ts`, `dispatch/mount.test.ts`,
  `dispatch/prefix-generation.test.ts`, `controller/live-stream.test.ts`,
  `dispatch/routing/concerns.test.ts` assigns a bare `RouteSet`), and the
  `!== false` guard in `static get app`.
- `TestResponse#parsedBody`
  (`packages/actionpack/src/action-dispatch/testing/test-response.ts`) is typed
  `unknown`, as is `ResponseParser`'s return
  (`action-dispatch/testing/request-encoder.ts:8`). Rails'
  `response.parsed_body["content_length"]` (`chunked_test.rb:30-31`) ports with
  `t.response.parsedBody as Record<string, unknown>`. `any` is refused by the
  `no-explicit-any` ratchet for actionpack.

## Acceptance criteria

- `IntegrationTest#app` carries a type under which `app.routes.draw` needs no
  cast, and the overriding test classes still typecheck.
- `TestResponse#parsedBody` carries a type under which indexing a parsed JSON
  body needs no cast.
- The casts named above are deleted from `controller/chunked.test.ts`,
  `dispatch/routing-assertions.test.ts`, `test-helpers/abstract-unit.ts` and
  `action-dispatch/testing/assertions/routing.ts`.
