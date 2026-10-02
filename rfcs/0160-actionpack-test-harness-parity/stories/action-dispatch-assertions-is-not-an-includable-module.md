---
title: "ActionDispatch::Assertions is not a module: TestCase::Behavior and IntegrationTest install its members by hand"
status: claimed
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: "2026-10-02T15:41:59Z"
assignee: "action-dispatch-assertions-is-not-an-includable-module"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while extracting `ActionController::TestCase::Behavior`
(`action-controller-test-case-behavior-module-is-unported`).

Rails' `ActionDispatch::Assertions`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions.rb`) is a
Concern that includes `ResponseAssertions`, `RoutingAssertions` and
`Rails::Dom::Testing::Assertions` and defines `html_document`. Both
`ActionController::TestCase::Behavior` (`action_controller/test_case.rb:598`) and
`ActionDispatch::IntegrationTest::Behavior`
(`action_dispatch/testing/integration.rb:659-700`) get all of it from one
`include ActionDispatch::Assertions`.

trails has no such module. `packages/actionpack/src/action-dispatch/testing/assertions.ts`
re-exports free functions, and each includer installs them one by one:

- `Behavior`'s `included do` block in
  `packages/actionpack/src/action-controller/test-case.ts` assigns
  `proto.assertResponse = …` through `proto.failOn = …`, defines the
  `htmlDocument` getter, assigns `proto.setup`, writes a `withRouting` static
  that forwards to `RoutingAssertions::ClassMethods#with_routing`, and calls
  `routingAssertions.spliceMethodMissing(proto)`;
- `packages/actionpack/src/action-dispatch/testing/integration.ts` does the same
  list by hand after the `IntegrationTest` class.

`RoutingAssertions` is itself a Concern in Rails (`testing/assertions/routing.rb:11-12`,
`ClassMethods` at `:79`, `setup` at `:98`, `method_missing` at `:245`), so its
`ClassMethods` and `setup` should arrive through the include, not through a
per-includer assignment. The `withRouting` static cannot be
`extend(this, routingAssertions.ClassMethods)` today: `ClassMethods` is a TS
`namespace` (a `var`), still unset when `test-case.ts` is entered through the
`routing.ts -> test-case.ts` import cycle.

`ActionController::TemplateAssertions`
(`packages/actionpack/src/action-controller/template-assertions.ts`) is included as
the module's namespace import; it is a bare exported function, not a module object.

## Acceptance criteria

- `ActionDispatch::Assertions`, `Assertions::ResponseAssertions` and
  `Assertions::RoutingAssertions` are live `Module`s (the latter extended with
  `Concern`, carrying `ClassMethods` and `method_missing`), in the files mirroring
  their `.rb`.
- `Behavior`'s `included do` block in `action-controller/test-case.ts` is
  `include(this, TemplateAssertions); include(this, Assertions);` followed by the
  `class_attribute`, `setup` and load hook, with no `proto.x = …` assignment.
- `IntegrationTest` gets the same members from one `include`.
- The merged `interface TestCase` no longer re-declares the assertion members by hand.
- `parity:api` holds for `test_case.rb`, `testing/assertions.rb`,
  `testing/assertions/response.rb`, `testing/assertions/routing.rb` and
  `testing/integration.rb`; both built `dist` modules import as entry modules.
