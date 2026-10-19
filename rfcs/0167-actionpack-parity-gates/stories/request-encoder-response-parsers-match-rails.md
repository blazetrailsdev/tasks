---
title: "request-encoder-response-parsers-match-rails"
status: in-progress
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps:
  - action-controller-test-case-has-no-assert-select
deps-rfc: []
est-loc: null
priority: null
pr: trails#9076
claim: "2026-10-19T15:14:49Z"
assignee: "integration-test-answers-assert-select"
blocked-by: null
closed-reason: null
---

## Context

Rails' `RequestEncoder` registers `:html` with `response_parser: -> body { Rails::Dom::Testing.html_document.parse(body) }` and `:json` with `JSON.parse(body, object_class: ActiveSupport::HashWithIndifferentAccess)` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/request_encoder.rb:57-58`). trails registers `html` as `(body) => body` and `json` as a bare `JSON.parse` (`packages/actionpack/src/action-dispatch/testing/request-encoder.ts:96-102`).

So `TestResponse#parsed_body` answers a String for HTML and a plain object for JSON, and "response parsing" (`vendor/rails/v8.0.2/actionpack/test/dispatch/test_response_test.rb:23-41`) cannot port its `assert_kind_of ActiveSupport::HashWithIndifferentAccess` and `assert_kind_of(Nokogiri::XML::Document, …)` / `at_xpath` assertions (`packages/actionpack/src/action-dispatch/dispatch/test-response.test.ts:27-40`). The two "JSON response … pattern matching" tests use Ruby's `=>` pattern (`assert_pattern`), which has no JS form; their rows may be a permanent receipt, decided here.

## Acceptance criteria

- The `html` parser parses through the DOM-testing `htmlDocument`, and the `json` parser builds `HashWithIndifferentAccess` objects, as Rails' do.
- "response parsing" carries Rails' five assertions and passes. The pattern-matching rows are either converged or receipted in `scripts/test-compare/assertion-receipts.ts` citing the language gap.
