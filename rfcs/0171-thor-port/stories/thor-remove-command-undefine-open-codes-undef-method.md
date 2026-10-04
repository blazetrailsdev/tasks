---
title: "Thor remove_command's :undefine arm calls rbModUndefMethod instead of an inline defineProperty"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - thor-remove-argument-undefine-open-codes-undef-method
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Base::ClassMethods#remove_command` (`vendor/thor/v1.3.2/lib/thor/base.rb:502-510`) ends with
`undef_method name if options[:undefine]`.

trails' port (`packages/trailties/src/thor/base.ts`, `removeCommand`, trails#8469) open-codes it as
`Object.defineProperty(this.prototype, name, { value: undefined, writable: true, configurable: true })`,
the same shape `removeArgument` uses, because ruby-compat has no class-level `Module#undef_method`
(`rb_mod_undef_method`, `vendor/ruby/v3.3.11/vm_method.c:1973`). An undefined name is not checked, where
Ruby raises `NameError`, and calling the removed command reads `undefined` instead of raising `NoMethodError`.

`thor-remove-argument-undefine-open-codes-undef-method` adds `rbModUndefMethod` for the `removeArgument`
site. This story is the second call site.

## Acceptance criteria

- [ ] `removeCommand` calls `rbModUndefMethod(this, name)` and the inline `defineProperty` is gone.
- [ ] `base.trails.test.ts`'s "undefines the method under :undefine" case asserts that calling the removed
      method raises `NoMethodError`, and that `removeCommand("nope", { undefine: true })` raises `NameError`.
