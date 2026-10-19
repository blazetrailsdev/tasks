---
title: "Port the integration and caching tests skipped on htmlDocument"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps:
  - action-controller-test-case-has-no-assert-select
  - integration-test-answers-assert-select
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

Measured on trails `main` @ `87094a5097`. With `action-controller-test-case-has-no-assert-select` (RFC 0123) landed, `htmlDocument` parses HTML and `assertSelect` exists. Six more actionpack tests are skipped only because `htmlDocument` throws for `text/html` (`packages/actionpack/src/action-dispatch/testing/assertions.ts:13-21`). No other story owns them:

- `packages/actionpack/src/action-controller/controller/integration.test.ts`, `IntegrationProcessTest`: `get` (:406), `post` (:440), `redirect` (:509), `redirect reset html document` (:550). These skips have no reason comment. When un-skipped, all four fail with `htmlDocument: HTML parsing (rails-dom-testing) is not yet implemented` (checked locally).
- `packages/actionpack/src/action-controller/controller/caching.test.ts`: `preserves order when reading from cache plus rendering` (:761) and `explicit render call with options` (:772), which are `BLOCKED: action-controller-test-case-has-no-assert-select`.

The request-forgery-protection skips belong to RFC 0141's `port-request-forgery-protection-assert-select-and-meta-tag-skips`. The four `TestCaseTest` skips belong to the dependency.

## Acceptance criteria

- All six tests run their Rails bodies (`vendor/rails/v8.0.2/actionpack/test/controller/integration_test.rb`, `caching_test.rb`) and pass.
- `pnpm parity:test --package actioncontroller` reports `integration_test.rb` with 0 skipped and `caching_test.rb` with only its four `.builder` PERMANENT-SKIPs, or two if those have moved.
