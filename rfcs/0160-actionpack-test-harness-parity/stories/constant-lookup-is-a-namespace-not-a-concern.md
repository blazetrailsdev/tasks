---
title: "ActiveSupport::Testing::ConstantLookup is a namespace, so TestCase::Behavior cannot include it"
status: done
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8399
claim: "2026-10-02T14:02:12Z"
assignee: "arel-remaining-nil-sends-read-ruby-compat-is-nil"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while extracting `ActionController::TestCase::Behavior`
(`action-controller-test-case-behavior-module-is-unported`).

Rails' `ActiveSupport::Testing::ConstantLookup`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/constant_lookup.rb`)
is a Concern whose `ClassMethods` carries `determine_constant_from_test_name`.
`ActionController::TestCase::Behavior` includes it
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:374`), which is
how `determine_default_controller_class` (`:409-413`) calls
`determine_constant_from_test_name(name)` on `self`. `ActionView::TestCase::Behavior`
and `ActionMailer::TestCase::Behavior` include it the same way.

trails' `packages/activesupport/src/testing/constant-lookup.ts` is a TS `namespace`
holding one free function, so `Behavior` in
`packages/actionpack/src/action-controller/test-case.ts` cannot include it and
`ClassMethods.determineDefaultControllerClass` calls
`ConstantLookup.determineConstantFromTestName(name, block)` on the namespace.

The same `Behavior` also omits `include Rails::Dom::Testing::Assertions`
(`test_case.rb:375`), which trails has not ported; that one is
`action-controller-test-case-has-no-assert-select`.

## Acceptance criteria

- `ConstantLookup` is a live `Module` extended with `Concern`, with
  `ClassMethods.determineConstantFromTestName`.
- `Behavior` includes it at `test_case.rb:374`, and
  `determineDefaultControllerClass` calls `this.determineConstantFromTestName(name, …)`.
- `parity:api` holds for `testing/constant_lookup.rb` and `test_case.rb`.
