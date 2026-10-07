---
title: "http-basic-authentication.test.ts drives Rails' DummyController through ActionController::TestCase"
status: claimed
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-10-07T02:11:50Z"
assignee: "api-params-wrapper-is-inlined-into-api-process-action"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/controller/http-basic-authentication.test.ts`
credits 15/15 against
`vendor/rails/v8.0.2/actionpack/test/controller/http_basic_authentication_test.rb`,
but its bodies are not Rails' bodies. Rails defines `DummyController` (`:6-58`)
with `before_action :authenticate` / `:authenticate_with_request` /
`:authenticate_long_credentials` and `http_basic_authenticate_with`, and each
test sets `@request.env[header]`, runs `get :index` / `:display` / `:show` /
`:search`, then asserts `assert_response` and `@response.body`.

The trails file instead builds a bare controller with `makeController` and calls
`authenticateOrRequestWithHttpBasic.call(c, ...)` directly, so no filter chain,
no `render`, and no `ActionController::TestCase` request runs. The
`AUTH_HEADERS.each` loops (`:62-104`) are ported as one test per name with a
literal empty interpolation (`"successful authentication with "`), so only
`HTTP_AUTHORIZATION` is exercised and the three other headers are not.
"authenticate with class method" (`:186-199`) drives a hand-made `beforeAction`
host rather than `get :search`.

The sibling files `controller/http-token-authentication.test.ts` and
`controller/http-digest-authentication.test.ts` (trails#8537) are the converged
shape: a `DummyController` with `static { this.beforeAction(...) }`, a
`TestCase` per test, `tc.request.env[header] = ...`, `await tc.get("index")`,
`tc.assertResponse(...)`, and the loops expanded with
`AUTH_HEADERS.forEach((header) => it(\`... ${header.toLowerCase()}\`, ...))`.

## Acceptance criteria

- `http-basic-authentication.test.ts` defines Rails' `DummyController`
  (`http_basic_authentication_test.rb:6-58`) and every test drives it through
  `ActionController::TestCase`, body for body, in Rails order.
- The `AUTH_HEADERS.each` loops run once per header.
- `makeController` and the direct `.call(c, ...)` invocations are gone.
- `pnpm parity:test --package actioncontroller` still reports the file complete
  and `pnpm parity:test:assertions` is green.
