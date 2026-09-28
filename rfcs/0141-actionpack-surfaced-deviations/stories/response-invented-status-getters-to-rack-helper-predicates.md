---
title: "Delete Response's invented status getters in favour of Rack::Response::Helpers predicates"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Response` now includes `Rack::Response::Helpers`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:91`,
PR #8210), so the Rack status predicates `successful?`, `redirection?`,
`client_error?`, `server_error?` and `not_found?`
(`vendor/rack/.../rack/response.rb` Helpers) reach it as `isSuccessful`,
`isRedirection`, `isClientError`, `isServerError` and `isNotFound`.

trails' `Response` still carries its own invented getters:

- `successful`, `redirection`, `clientError`, `serverError`, `notFound`
  (`packages/actionpack/src/action-dispatch/http/response.ts:211-225`)

They duplicate the included helpers under non-Rails names: no Ruby method is
spelled without the predicate `?`. Callers:

- `action-dispatch/dispatch/response.test.ts` (18)
- `action-controller/controller/action-pack-assertions.test.ts` (12)
- `action-controller/test-case.ts` (3)

## Acceptance criteria

- The five invented getters are deleted from `http/response.ts`.
- Every caller uses the Rack-helper predicate (`isSuccessful`, …), as the Rails
  tests call `@response.successful?` etc.
- `parity:api:extra --package actiondispatch` drops those names from
  `http/response.ts`.
