---
title: "activerecord: Core#initialize runs initialize_internals_callback after assign_attributes, from Base's constructor"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

`ActiveRecord::Core#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-481`) is

    @new_record = true
    @attributes = self.class._default_attributes.deep_dup
    init_internals
    initialize_internals_callback
    super
    yield self if block_given?
    _run_initialize_callbacks

`packages/activerecord/src/core.ts`'s `constructor` ports the first three lines and the `super`
(trails PR 8439). The other three stay in `Base`'s JS constructor
(`packages/activerecord/src/base.ts`), after `super(attrs)` has returned, so after
`assign_attributes`:

- `inheritanceInitializeInternalsCallback.call(this)` is called by name, not through the
  `initialize_internals_callback` chain (`inheritance.rb:357-360`, `scoping.rb:81-88`), and
  `Scoping#initialize_internals_callback` is replaced by `_applyScopeAttributes`, which skips the
  keys the caller assigned because it runs after them. Rails runs the chain BEFORE `super`, so an
  assigned attribute overwrites a scope attribute by order alone.
- the block and `_run_initialize_callbacks` run there too, guarded by `_suppressInitializeCallback`.

This ordering predates PR 8439, which did not touch those lines.

## Acceptance criteria

- [ ] `Core#initialize`'s port calls `this.initializeInternalsCallback()` between `initInternals()`
      and `super`, and the chain reaches `Scoping`'s and `Inheritance`'s bodies through `super`.
- [ ] `_applyScopeAttributes` and its assigned-keys set are deleted.
- [ ] The block yield and `_run_initialize_callbacks` follow `super` in that same body, or are
      blocked with the specific reason they cannot leave the JS constructor.
- [ ] `scoping/default-scoping.test.ts`, `inheritance.test.ts` and `base.test.ts` stay green.
