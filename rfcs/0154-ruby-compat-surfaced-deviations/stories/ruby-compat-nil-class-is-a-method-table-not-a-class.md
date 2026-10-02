---
title: "ruby-compat's NilClass is a method table, so nil.class has no class object to pass"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps:
  - core-classes-have-no-class-object-visitor-keys-by-name
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8401.

Ruby's `nil.class` is `NilClass`, a real class. Rails relies on that where a
value's class is taken without a nil check:
`ActionController::TestCase::Behavior#setup_controller_request_and_response`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:582`) is
`@request = TestRequest.create(@controller.class)`, so a test whose controller
could not be constructed builds its request with `NilClass`, and
`TestRequest#controller_class` (`:54`) answers `NilClass`.

trails has no class object for `nil.class`. ruby-compat's `NilClass`
(`packages/ruby-compat/src/nil-class.ts`) is a frozen null-prototype method
table (`toI`, `toF`, `toS`, `toA`, `toH`, `inspect`, `matchOperator`,
`isNil`), read by `numeric.ts`, `string/method-table.ts` and activesupport's
`delegation.ts` (`Object.hasOwn(NilClass, method)`). `rbObjClass(null)` answers
the string `"NilClass"`, and activesupport carries two more `class NilClass`
declarations for the core-ext reopenings (`core-ext/object/blank.ts`,
`core-ext/object/json.ts`).

So PR 8401 passes `null` for a missing controller, and
`request.controllerClass()` answers `null` where Rails answers `NilClass`. The
PR's reviewer holds that finding open; it shipped by maintainer decision.

A class with static methods does not work as is: a class function owns `name`,
`length` and `prototype`, so `Object.hasOwn(NilClass, "name")` would make
`delegate :name, allow_nil: true` dispatch to it.

## Acceptance criteria

- ruby-compat exports a `NilClass` that is a class: `rbModToS` names it
  `NilClass`, and it carries the methods `nil` answers
  (`vendor/ruby/v3.3.11/object.c:4415-4425`) in a shape `delegation.ts` can
  still probe without answering `name` / `length` / `prototype`.
- `setupControllerRequestAndResponse`
  (`packages/actionpack/src/action-controller/test-case.ts`) passes that class
  for a missing controller, and the test in `test-case.trails.test.ts` asserts
  `request.controllerClass()` answers it.
- `parity:api:extra:gate` stays green for ruby-compat.
