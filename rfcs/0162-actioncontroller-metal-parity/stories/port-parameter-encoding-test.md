---
title: "Port controller/parameter_encoding_test.rb"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
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

trails#8560 extended `ActionController::ParameterEncoding::ClassMethods` onto `Base`
(`packages/actionpack/src/action-controller/metal/parameter-encoding.ts`) and covered it with
trails-only tests in `packages/actionpack/src/action-dispatch/dispatch/request.trails.test.ts`.
The Rails test file `vendor/rails/v8.0.2/actionpack/test/controller/parameter_encoding_test.rb`
(5 tests, `ParameterEncodingController` at `:5-25`) has no trails counterpart.

Four of its five tests assert `params[:x].encoding` (`:31-58`), which a JS string cannot answer
(CLAUDE.md § "Ruby Strings are JS string primitives"). The fifth, "does not raise an error when
passed a param declared as ASCII-8BIT that contains invalid bytes" (`:60-65`), also asserts
`assert_response :success`, which is portable through `ActionController::TestCase`.

## Acceptance criteria

- [ ] `packages/actionpack/src/action-controller/controller/parameter-encoding.test.ts` exists
      with `ParameterEncodingController` ported at its Rails name and the five tests at their
      Rails names.
- [ ] The `assert_response :success` assertions run. An assertion that reads `String#encoding`
      is dropped with a row in `scripts/test-compare/assertion-receipts.ts`, or the test is
      parked as `it.skip` under a `PERMANENT-SKIP:` line, citing CLAUDE.md § "Ruby Strings are
      JS string primitives".
- [ ] `pnpm parity:test` credits the file and `pnpm parity:test:assertions` stays green.
