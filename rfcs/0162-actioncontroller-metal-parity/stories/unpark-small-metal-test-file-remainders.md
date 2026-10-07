---
title: "Un-park the seven tests the small metal test file port left blocked"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "debug-exceptions-gates-on-wrapper-show-and-request-headers",
    "middleware-build-returns-a-closure-not-the-middleware-instance",
    "request-params-pipeline-drops-a-hash-with-indifferent-access",
    "psych-dump-puts-root-tag-on-its-own-line",
    "parameters-holds-a-plain-object-not-hash-with-indifferent-access",
  ]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-small-metal-test-files` (trails PR 8569) ported seven of the small
`vendor/rails/v8.0.2/actionpack/test/controller/` files but parked seven tests
`it.skip` under `BLOCKED:` lines, so three files do not report complete in
`pnpm parity:test --package actioncontroller`:

- `show-exceptions.test.ts` (`show_exceptions_test.rb:28-33,60-64,74-88`): four
  tests on `debug-exceptions-gates-on-wrapper-show-and-request-headers`, and
  "render failsafe exception" (`:98-112`) on
  `middleware-build-returns-a-closure-not-the-middleware-instance`. They also
  need Rails' `test/fixtures/public/500.html` in
  `packages/actionpack/src/test-helpers/fixtures/public/`.
- `webservice.test.ts` "register and use json simple" (`webservice_test.rb:68-82`)
  on `request-params-pipeline-drops-a-hash-with-indifferent-access`.
- `parameters-integration.test.ts` "parameters can be serialized as YAML"
  (`parameters_integration_test.rb:22-34`) on
  `psych-dump-puts-root-tag-on-its-own-line` and
  `parameters-holds-a-plain-object-not-hash-with-indifferent-access`.

## Acceptance criteria

- [ ] All seven tests are un-skipped and green, bodies unchanged from Rails.
- [ ] `show_exceptions_test.rb`, `webservice_test.rb` and
      `parameters_integration_test.rb` report complete in
      `pnpm parity:test --package actioncontroller`.
