---
title: "activesupport: callback-inheritance and hwia-extended callback tests build the Rails class hierarchies"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `activesupport-callbacks-free-target-functions-are-not-class-methods`,
which converted the activesupport source hosts and `callbacks.test.ts`.

Two Rails-mirrored activesupport test files still call the free target-taking
functions on plain objects:

- `packages/activesupport/src/callback-inheritance.test.ts` (~39 calls). Rails'
  `vendor/rails/v8.0.2/activesupport/test/callback_inheritance_test.rb` builds
  classes: `GrandParent` `include ActiveSupport::Callbacks` and
  `define_callbacks :dispatch`, with `Parent` / `Child` subclasses calling
  `skip_callback`, and `EmptyParent` / `EmptyChild`, `CountingParent` / `CountingChild`.
  The trails file uses `const target = { log: [] }` and `Object.create(base)`.
- `packages/activesupport/src/hwia-extended.test.ts` (~19 calls) has
  `CallbackFalseTerminatorTest`, `ExcludingDuplicatesCallbackTest`,
  `ResetCallbackTest`, `RunSpecificCallbackTest` over `const proto = {}`; the Rails
  classes are in `vendor/rails/v8.0.2/activesupport/test/callbacks_test.rb`.

The converted shape is in `packages/activesupport/src/callbacks.test.ts`.

## Acceptance criteria

- [ ] Neither file imports the free `defineCallbacks` / `setCallback` / `skipCallback` / `resetCallbacks` / `runCallbacks`.
- [ ] Each test builds the class hierarchy its Rails test builds, with `include(X, Callbacks)`; test names are unchanged.
