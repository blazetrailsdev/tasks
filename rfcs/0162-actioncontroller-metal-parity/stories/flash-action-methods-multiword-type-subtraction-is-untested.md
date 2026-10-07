---
title: "Flash action_methods subtraction of a multi-word flash type has no test"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8643
claim: "2026-10-07T16:33:20Z"
assignee: "default-helper-module-raises-for-binding-named-controller-class"
blocked-by: null
closed-reason: null
---

## Context

`Flash::ClassMethods#action_methods` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:47-49`) is `@action_methods ||= super - _flash_types.map(&:to_s).to_set`. Since trails#8573 the action-method cache maps each Rails action name to its JS method, and `packages/actionpack/src/action-controller/metal/flash.ts` `actionMethods` drops an entry whose action name or whose JS method is a flash type. No test pins this: an inherited `fooBar` action shadowed by `addFlashTypes("fooBar")`, and by `addFlashTypes("foo_bar")`, must not be an action, and `process("foo_bar")` must raise `ActionNotFound` for it. Rails' `flash_test.rb` covers single-word types only ("add flash type to subclasses", "does not redefine flash types").

## Acceptance criteria

- [ ] A test in `packages/actionpack/src/action-controller/controller/flash.trails.test.ts` covers a multi-word flash type shadowing an inherited action in both spellings, asserting `actionMethods()` omits `foo_bar` and dispatching it raises `ActionNotFound`.
- [ ] The test fails if `flash.ts` filters by only one of the two spellings.
