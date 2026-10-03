---
title: "activesupport: the free target-taking callback functions and CallbacksMixin stand in for Callbacks::ClassMethods"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8453
claim: "2026-10-03T18:35:22Z"
assignee: "activesupport-callbacks-free-target-functions-are-not-class-methods"
blocked-by: null
closed-reason: null
---

## Context

`activesupport-callbacks-chains-are-not-the-callbacks-class-attribute` moved the
callback chains onto the `__callbacks` class attribute and ported
`Callbacks::ClassMethods` (`__updateCallbacks`, `setCallback`, `skipCallback`,
`resetCallbacks`, `defineCallbacks`, `getCallbacks`, `setCallbacks`) as the Rails
bodies (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:691-945`).

What it left, in `packages/activesupport/src/callbacks.ts`, is the free
`target`-taking surface Rails does not have:

- `defineCallbacks(target, …)`, `setCallback(target, …)`, `skipCallback(target, …)`
  and `resetCallbacks(target, …)` are now one-line shims onto the class methods.
  They resolve a class through the module-private `callbacksClass(target)`: a
  class prototype answers its constructor, any other object answers
  `rbObjSingletonClass(target)`, and the `included do` body is run on it if the
  hierarchy has no `__callbacks` yet. `setCallback` carries two
  `@missingRailsCall … — CONVERGEABLE` receipts pointing here, because
  `parity:api` pairs `set_callback` with the free shim.
- `CallbacksMixin` duplicates the class methods as statics that call the shims.
- ~40 source callers pass `this.prototype` (`activemodel/src/callbacks.ts`,
  `activemodel/src/validations.ts`, `activesupport/src/reloader.ts`,
  `execution-wrapper.ts`, `current-attributes.ts`, `testing/setup-and-teardown.ts`,
  `trailties/src/engine.ts`, `activerecord/src/connection-adapters/abstract-adapter.ts`,
  …) where Rails calls `define_callbacks` / `set_callback` on a class that
  `include ActiveSupport::Callbacks`.
- ~300 test callers, mostly `activesupport/src/callbacks.trails.test.ts`,
  `callbacks.test.ts`, `callback-inheritance.test.ts` and `hwia-extended.test.ts`,
  pass a plain object (`const target = {}`), which is the only reason the
  singleton-class arm exists. Rails' tests build a class (`Class.new { include
ActiveSupport::Callbacks }`, `activesupport/test/callbacks_test.rb`).
- `runCallbacks(target, …)` reads `target.__callbacks?.[name]` and runs the block
  when no chain is defined, where `run_callbacks` (`callbacks.rb:96-97`) reads
  `__callbacks[kind.to_sym]` unguarded.
- `classAttribute`'s `singleton_class?` arm (`core_ext/class/attribute.rb:105-106`)
  is ported only as far as keeping the reader `ClassAttribute.redefine` seats on
  the attached object; it exists for the plain-object targets above.
- `ClassMethods#setCallbacks` registers the class with `DescendantsTracker` on
  its first own write, since JS has no `Class#subclasses`. A class that never
  writes is reached through the inherited attribute, so this is only observable
  through `descendants`.

## Acceptance criteria

- [ ] Every source host `include(X, Callbacks)`s and calls the class methods (`X.defineCallbacks("save")`, `X.setCallback("save", …)`); no source file imports the free `defineCallbacks` / `setCallback` / `skipCallback` / `resetCallbacks`.
- [ ] The four free functions, `callbacksClass`, and `CallbacksMixin` are deleted, with the two `@missingRailsCall` receipts on `setCallback`.
- [ ] Tests that pass a plain object build a class that includes `Callbacks`, as the Rails test they mirror does; test names are unchanged.
- [ ] `runCallbacks` is the instance method only, reading `this.__callbacks[kind]` as `callbacks.rb:96-97` does.
- [ ] `classAttribute`'s singleton arm is either the Rails body or gone with its last caller.
- [ ] If the work is larger than one PR, split it by package (activesupport hosts and tests first), one story each.
