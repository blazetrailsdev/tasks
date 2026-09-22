---
title: "callbacks-conditional-tests-class-conditions-use-classes"
status: closed
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Sunset of 0132. trails#7982 converged callbacks_test.rb's assertions and taught CallTemplate.build to route class constructors to ObjectCall; this residue is test-body stand-in shape only (object literal vs Class in ConditionalTests 'class conditional with scope'/'class', callbacks.test.ts:866/890) with no parity:test or assertion-counter row (51 matched + 3 skipped, 0 extra). No active RFC owns test-side body drift after 0132; re-file under a successor assertion RFC if one opens."
---

## Context

`ConditionalTests#test_class_conditional_with_scope` and `#test_class` in
`vendor/rails/activesupport/test/callbacks_test.rb:1009-1038` pass a **Class**
(`Class.new { define_singleton_method(:foo / :before) { |o| z << o } }`) as the
`if:` condition. Rails' `CallTemplate.build`
(`activesupport/lib/active_support/callbacks.rb:494-510`) routes that non-Proc
through `ObjectCall`.

`packages/activesupport/src/callbacks.test.ts` (`describe("ConditionalTests")`,
`class conditional with scope` / `class`) passes a plain object literal with the
method instead. trails#7982 taught `CallTemplate.build` to route a class
constructor to `ObjectCall` (the `CallbackTypeTest` `add class` / `skip class`
fixtures now pass `class { static before(o) {...} }`), so these two tests can
take the Rails shape as well. That PR's reviewer asked to keep them out of its
scope.

## Acceptance criteria

- Both tests pass `class { static foo(o) { z.push(o); } }` /
  `class { static before(o) { z.push(o); } }` as the condition, mirroring
  `callbacks_test.rb:1011-1013` and `:1032-1034`.
- No test renamed; `parity:test` for `callbacks_test.rb` unchanged (51 matched +
  3 skipped, 0 extra).
