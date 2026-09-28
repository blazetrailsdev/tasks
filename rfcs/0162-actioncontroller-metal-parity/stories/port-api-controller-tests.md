---
title: "Port the ActionController::API test files"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "conditional-get-and-etag-invented-helpers",
    "metal-invented-registries-fold-into-rails-state",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Six files under `vendor/rails/v8.0.2/actionpack/test/controller/api/` have no
trails counterpart:

| Rails file                | Tests | Class                                        |
| ------------------------- | ----- | -------------------------------------------- |
| `conditional_get_test.rb` | 10    | `ConditionalGetApiTest` (`:35-109`)          |
| `data_streaming_test.rb`  | 1     | `DataStreamingApiTest`                       |
| `rate_limiting_test.rb`   | 2     | `ApiRateLimitingTest`                        |
| `redirect_to_test.rb`     | 1     | `RedirectToApiTest`                          |
| `with_cookies_test.rb`    | 1     | `WithCookiesTest`                            |
| `with_helpers_test.rb`    | 2     | `WithHelpersTest`, `SubclassWithHelpersTest` |

They pin which modules `ActionController::API` includes (`action_controller/api.rb`).
`api/renderers_test.rb` and `api/implicit_render_test.rb` are RFC 0161 (controller rendering);
`api/url_for_test.rb` RFC 0163 (routing); `api/params_wrapper_test.rb`
`port-params-wrapper-tests`.

`api-redirect-to-override-and-head-response-are-invented` (RFC 0141) covers
`api.ts`'s moved `redirectTo` / `render`.

## Acceptance criteria

- The six files exist under `controller/api/` and port every test in Rails
  order.
- All six report complete in `pnpm parity:test --package actioncontroller`.
