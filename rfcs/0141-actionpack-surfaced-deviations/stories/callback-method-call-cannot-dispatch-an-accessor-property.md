---
title: "Callbacks MethodCall raises NoMethodError for a condition naming an accessor property"
status: done
updated: 2026-10-05
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8518
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Callbacks::CallTemplate::MethodCall#make_lambda`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:359-369`) is
`target.send(@method_name, &block)`. trails' `MethodCall#send`
(`packages/activesupport/src/callbacks.ts:99-110`) reads `target[methodName]` and
raises `NoMethodError` unless it is a function.

A zero-arg Ruby reader ports as an accessor property (CLAUDE.md, "Generated
attribute readers are properties"), so a callback condition naming an
`attr_accessor` cannot dispatch. `SkipProtectionController`
(`vendor/rails/v8.0.2/actionpack/test/controller/request_forgery_protection_test.rb:190-195`)
is `skip_forgery_protection if: :skip_requested` over
`attr_accessor :skip_requested`; its port in
`packages/actionpack/src/action-controller/controller/request-forgery-protection.test.ts`
spells the reader as a `skipRequested()` method and the writer as
`setSkipRequested()` to get past it.

`rbFSend` (`packages/ruby-compat/src/object.ts:684`) already answers a zero-arg
send from a property or getter.

## Acceptance criteria

- `MethodCall`'s lambdas dispatch a name that is an accessor property or getter
  on the target, as `target.send` does, and still raise `NoMethodError` for an
  undefined name.
- `SkipProtectionController` in `request-forgery-protection.test.ts` declares
  `skipRequested` as a property and the two `SkipProtectionControllerTest`
  bodies assign it (`controller.skipRequested = false`).
- A `.trails.test.ts` case covers a Symbol condition naming a property.
