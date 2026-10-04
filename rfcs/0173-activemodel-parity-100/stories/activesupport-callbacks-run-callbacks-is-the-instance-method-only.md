---
title: "activesupport: delete the free target-taking callback functions and CallbacksMixin; run_callbacks is the instance method only"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activesupport"]
deps:
  [
    "activesupport-callbacks-trails-test-builds-classes-not-plain-object-targets",
    "activesupport-callback-inheritance-and-hwia-tests-build-classes",
    "callbacks-hosts-outside-activesupport-call-the-class-methods",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8466
claim: "2026-10-04T00:08:31Z"
assignee: "activesupport-callbacks-run-callbacks-is-the-instance-method-only"
blocked-by: null
closed-reason: null
---

## Context

Last step of the split of `activesupport-callbacks-free-target-functions-are-not-class-methods`.
Once no caller is left, delete the free target-taking surface in
`packages/activesupport/src/callbacks.ts` that Rails does not have:

- `defineCallbacks(target, …)`, `setCallback(target, …)`, `skipCallback(target, …)`, `resetCallbacks(target, …)` and the module-private `callbacksClass`. `setCallback` carries two `@missingRailsCall … — CONVERGEABLE` receipts pointing at this story.
- `CallbacksMixin`.
- `runCallbacksOn`, exported as `runCallbacks`, receipted `@noRailsEquivalent CONVERGEABLE` against this story. The implementation is already the instance method `Callbacks.runCallbacks`.
- `runCallbacks` reads `this.__callbacks?.[name]` and runs the block when no chain is defined; `run_callbacks` (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:96-97`) reads `__callbacks[kind.to_sym]` unguarded. Its first parameter is `name` where Rails has `kind`.
- `classAttribute`'s `singleton_class?` arm (`core_ext/class/attribute.rb:105-106`) is ported only as far as keeping the reader `ClassAttribute.redefine` seats on the attached object. `ExtendCallbacksTest` (`activesupport/test/callbacks_test.rb:362-367`, `base.class_eval { set_callback … }` on an instance) still reaches a singleton class, so the arm becomes the Rails body rather than going away.
- `ClassMethods#setCallbacks` registers the class with `DescendantsTracker` on its first own write.
- The exports in `packages/activesupport/src/index.ts:317-322`.

## Acceptance criteria

- [ ] The four free functions, `callbacksClass`, `CallbacksMixin` and `runCallbacksOn` are deleted, with their receipts and index exports.
- [ ] `runCallbacks(kind, type)` reads `this.__callbacks[kind]` unguarded, as `callbacks.rb:96-97` does.
- [ ] `classAttribute`'s singleton arm is the Rails body (`core_ext/class/attribute.rb:105-106`).
