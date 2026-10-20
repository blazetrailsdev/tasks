---
title: "activesupport: Callbacks and LogSubscriber::TestHelper become plain modules with their includers' super inlined"
status: claimed
updated: 2026-10-20
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps:
  - actionpack-module-super-inlined-into-includers
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-20T14:18:13Z"
assignee: "ar-type-remaining-src-part-2"
blocked-by: null
closed-reason: null
---

## Context

trails#9096 tried converting two activesupport modules to plain objects and reverted both, because includers reach them through `super`:

- `packages/activesupport/src/callbacks.ts` `Callbacks`: its empty `haltedCallbackHook` (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:110`) gets copied onto controllers. There it outranks `ActionController::Instrumentation#halted_callback_hook` (`actionpack/lib/action_controller/metal/instrumentation.rb`), which is reached through a carrier link (`packages/actionpack/src/action-controller/metal/instrumentation.ts:34`). The CI failure was `ACLogSubscriberTest > halted callback`.
- `packages/activesupport/src/log-subscriber/test-helper.ts` `TestHelper`: test classes call `super.setup()` / `super.teardown()` into it (`actionpack/test/controller/log_subscriber_test.rb:105`, `actionview/test/activerecord/controller_runtime_test.rb:39`). A copied method is overwritten by the class's own `setup`.

## Acceptance criteria

- Both modules are plain-object modules, converted in the same PR as `Instrumentation` (and the other actionpack `super` modules in `actionpack-module-super-inlined-into-includers`), with each `super` inlined into its includers under `@inlinedFrom`.
- The log-subscriber and halted-callback suites in actionpack and actionview pass.
