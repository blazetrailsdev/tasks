---
title: "ActionDispatch::Assertions does not include Rails::Dom::Testing::Assertions: the ported DomAssertions half is not a module and not reachable from actionpack"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails PR 8406
(`action-dispatch-assertions-is-not-an-includable-module`).

Rails' `ActionDispatch::Assertions` includes three modules
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions.rb:13-15`):
`ResponseAssertions`, `RoutingAssertions` and `Rails::Dom::Testing::Assertions`.
The third is rails-dom-testing's aggregate
(`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions.rb:9-12`),
which includes `DomAssertions` and `SelectorAssertions`.
`ActionController::TestCase::Behavior` includes it again directly
(`action_controller/test_case.rb:375`).

trails' `Assertions` module
(`packages/actionpack/src/action-dispatch/testing/assertions.ts`) includes only
the first two, so `ActionController::TestCase` and `IntegrationTest` answer
neither `assertDomEqual` nor `assertSelect`.

The two halves are in different states:

- `DomAssertions` is ported (trails PR 8268) as free functions in
  `packages/actionview/src/testing/dom-assertions.ts`: `assertDomEqual`,
  `assertDomNotEqual` and the private helpers of
  `rails/dom/testing/assertions/dom_assertions.rb:35-133`. It is not a `Module`,
  it sits flat under actionview's `testing/` rather than at the gem's
  `assertions/dom_assertions` path, it is not exported from the actionview
  entry, and the only consumers are seven actionview test files importing it
  relatively.
- `SelectorAssertions` is unported and blocked on an HTML parser:
  `action-controller-test-case-has-no-assert-select`, behind
  `dom-assertions-fragment-parses-with-nokogiri-html4`.

What is undecided is where `Rails::Dom::Testing` lives in trails. It is a
separate gem with its own top-level `Rails` namespace. trails has no package for
it, no namespace object for it (`TopLevel.Trails` is trailties' `::Rails`), and
`vitest.config.ts` aliases `@blazetrails/actionview` to its `index.ts`, so an
actionpack import of an actionview subpath also needs the alias and dx-tests
`paths` registrations.

## Acceptance criteria

- `Rails::Dom::Testing::Assertions` and `Assertions::DomAssertions` are live
  `Module`s, in files mirroring `rails/dom/testing/assertions.rb` and
  `assertions/dom_assertions.rb`, reachable from actionpack.
- `ActionDispatch::Assertions` includes the aggregate after `RoutingAssertions`,
  as `assertions.rb:13-15` orders them, and `Behavior` includes it as
  `test_case.rb:375` does.
- `ActionController::TestCase` and `IntegrationTest` answer `assertDomEqual` and
  `assertDomNotEqual`; a test asserts it.
- The aggregate includes `SelectorAssertions` once
  `action-controller-test-case-has-no-assert-select` lands; this story does not
  wait on it.
