---
title: "ActionController::TestCase#process accepts invented env: and headers: options"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::TestCase::Behavior#process`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:512`) takes exactly
`method:, params:, session:, body:, flash:, format:, xhr:, as:`. It has no `headers:` or
`env:` keyword. A functional test that needs a header or env value writes it onto the held
request before the call, e.g. `@request.remote_addr = "192.0.0.1"`
(`actionpack/test/controller/test_case_test.rb:734-742`), `@request.env["HTTPS"] = "on"` or
`@request.headers[...] = ...`.

trails' `RequestOptions` (`packages/actionpack/src/action-controller/test-case.ts`) still
carries two invented options:

- `env`: each entry is `setHeader`ed onto the request.
- `headers`: each name is upcased, `HTTP_`-prefixed and `setHeader`ed.

`process` applies both before `setupRequest`. Since trails#8275, `tc.request` is the held
`TestRequest` that `process` rebuilds from, so every caller can make Rails' write directly
and the options have no remaining reason to exist. Callers:

- `test-case.test.ts` `sets custom headers` (`headers: { "X-Custom": "test" }`).
- `test-case.test.ts` `request protocol is reset after request` (skipped, `env: { HTTPS: "on" }`;
  Rails `test_case_test.rb` writes `@request.env["HTTPS"] = "on"`).
- Roughly a dozen more `tc.get/post(..., { env | headers })` sites across the actionpack
  controller tests.

`IntegrationTest`'s `headers:` / `env:` are a different Rails API
(`action_dispatch/testing/integration.rb` `process(method, path, params:, headers:, env:, ...)`)
and are out of scope.

## Acceptance criteria

- [ ] `RequestOptions` for `ActionController::TestCase#process` has exactly Rails' keys
      (`method`, `params`, `session`, `body`, `flash`, `format`, `xhr`, `as`), per
      `test_case.rb:512`.
- [ ] The `env` / `headers` application block is removed from `process`.
- [ ] Every caller writes onto `tc.request` (`setHeader` / `env[...]` / the `TestRequest`
      writers) before the call, mirroring the Rails test it ports.
