---
title: "Rails::Dom::Testing::Assertions is a plain-object module"
status: done
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9083
claim: "2026-10-19T17:44:07Z"
assignee: "globalid-map-railtie-test-onto-trailtie"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Dom::Testing::Assertions` (`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions.rb`) is ported in `packages/actionview/src/testing/assertions.ts` (trails#9068) as a ruby-compat `new Module(...)` that includes `DomAssertions` and `SelectorAssertions`.

It is a `Module` only because its includers `ActionController::TestCase::Behavior` (`packages/actionpack/src/action-controller/test-case.ts`) and `ActionDispatch::Assertions` (`packages/actionpack/src/action-dispatch/testing/assertions.ts`) are `Module`s. A plain module included into a `Module` goes through `appendPlainFeatures` (`packages/ruby-compat/src/include.ts:726`). That copies its members onto the `Module`'s carrier, so `SelectorAssertions#documentRootElement` (which raises `NotImplementedError`) shadows `Behavior#documentRootElement` (`actionpack/lib/action_controller/test_case.rb:681-683`). A nested `Module` is skipped once it is in the ancestry (`include.ts:482-484`).

## Acceptance criteria

- `Rails::Dom::Testing::Assertions` is a plain-object module: `export const Assertions = {}; include(Assertions, DomAssertions); include(Assertions, SelectorAssertions);`.
- Either `Behavior` and `ActionDispatch::Assertions` are plain-object modules first (deps), or `appendPlainFeatures` records a plain module included into a `Module` instead of flattening it.
- The four `TestCaseTest` assert_select tests (`test_case_test.rb:223,230,431,444`) stay green.
