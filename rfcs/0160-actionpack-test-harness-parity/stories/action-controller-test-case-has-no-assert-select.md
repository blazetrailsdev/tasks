---
title: "action-controller-test-case-has-no-assert-select"
status: draft
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::TestCase::Behavior` includes `Rails::Dom::Testing::Assertions`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:375`), so a
controller test calls `assert_select`, and `ActionDispatch::Assertions#html_document`
(`action_dispatch/testing/assertions.rb:17-23`) parses an HTML response with
`Rails::Dom::Testing.html_document`.

trails' `TestCase` (`packages/actionpack/src/action-controller/test-case.ts`) has
no `assertSelect`, and `htmlDocument`
(`packages/actionpack/src/action-dispatch/testing/assertions.ts:10-18`) throws
for any response whose media type does not end in `xml`.

Four `TestCaseTest` tests are `it.skip` on it in
`packages/actionpack/src/action-controller/controller/test-case.test.ts`:
`test_assert_select_without_body` (`test_case_test.rb:223`),
`test_assert_select_with_body` (`:230`),
`test_should_impose_childless_html_tags_in_html` (`:431`) and
`test_should_not_impose_childless_html_tags_in_xml` (`:444`).

## Acceptance criteria

- `htmlDocument` parses an HTML response, mirroring `assertions.rb:17-23`.
- `ActionController::TestCase` answers `assertSelect` from the
  rails-dom-testing port, mixed in as `test_case.rb:375` does.
- The four tests are ported with their Rails bodies; `TestController` gains
  `testWithoutBody`, `testWithBody` and `testXmlOutput`
  (`test_case_test.rb:108-115,159-165`).
