---
title: "MethodCallAssertions is an includable module"
status: draft
updated: 2026-11-03
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
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

`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/method_call_assertions.rb` is a module (`module MethodCallAssertions`) that test classes include, e.g. `include ActiveSupport::Testing::MethodCallAssertions` in `vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb:596`. `packages/activesupport/src/testing/method-call-assertions.ts` exports free functions (`assertCalled`, `assertCalledWith`, `assertNotCalled`, `assertCalledOnInstanceOf`, `assertNotCalledOnInstanceOf`, `stubAnyInstance`, `stub`) and no module object, so `packages/trailties/src/test-helpers/isolation/abstract-unit.ts` cannot `include(TestCase, MethodCallAssertions)` (trails#9646).

## Acceptance criteria

- `method-call-assertions.ts` exports a `MethodCallAssertions` plain-object module whose members are the Rails methods (`assert_called`, `assert_called_with`, `assert_not_called`, `assert_called_on_instance_of`, `assert_not_called_on_instance_of`, `stub_any_instance`) as `this`-receiving methods.
- `abstract-unit.ts` adds `include(TestCase, MethodCallAssertions)` after `Stream`, as `abstract_unit.rb:596` does.
