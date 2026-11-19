---
title: "solid-queue-cold-attribute-method-generation"
status: draft
updated: 2026-11-19
rfc: "0154-ruby-compat-surfaced-deviations"
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
closed-reason: null
---

# A model's first attribute-method generation costs ~150-200ms cold

## Context

Found while fixing `solid-queue-dispatcher-multiple-instances-flake`. The first
`Job.createBang` in a process spends ~150ms of CPU in
`ActiveModel::AttributeMethods::ClassMethods#define_attribute_methods`
(`packages/activemodel/lib/attribute-methods.ts:148`, via
`initInternals` in `packages/activerecord/lib/base.ts:536`), almost all of it in
ruby-compat's `moduleEval` (`packages/ruby-compat/lib/include.ts:168`) and
`relinkIncluders` (`include.ts:722`), called once per generated method from
`CodeGenerator#execute` (`packages/activemodel/lib/code-generator.ts:87`).
`ScheduledExecution` and `ReadyExecution` add ~30ms each. Every later record
costs ~1ms. Ruby's `define_attribute_methods` is a few ms
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb`).

This made `DispatcherTest > run more than one instance of the dispatcher`
flake: its first `performLater` (scheduled 0.2s ahead) took >200ms, so the
first job was already due at enqueue and went straight to
`ReadyExecution` (14 scheduled instead of 15). `packages/solid-queue/test/dispatcher.test.ts`'s
`beforeAll` now pre-generates the three models' attribute methods; that warm-up
goes once this is fixed.

## Acceptance criteria

- `CodeGenerator#execute` applies a batch of generated methods with one
  relink of includers, not one per method (or an equivalent fix), so a
  ~15-column model's first generation is under 20ms outside vitest.
- The warm-up loop in `packages/solid-queue/test/dispatcher.test.ts`'s
  `beforeAll` is deleted and the test still passes 50 consecutive runs.
