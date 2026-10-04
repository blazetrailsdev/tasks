---
title: "Thor remove_argument's :undefine arm calls a class-level rbModUndefMethod instead of an inline defineProperty"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Base::ClassMethods#remove_argument` (`vendor/thor/v1.3.2/lib/thor/base.rb:426-433`) ends with
`undef_method name, "#{name}=" if options[:undefine]`.

trails' port (`packages/trailties/src/thor/base.ts`, `removeArgument`, merged in trails#8464) open-codes it as
`Object.defineProperty(this.prototype, name, { value: undefined, writable: true, configurable: true })`,
because ruby-compat has `Module#undefMethod` (`packages/ruby-compat/src/include.ts`, for a `Module` carrier) but no
class-level `Module#undef_method` (`rb_mod_undef_method`, `vendor/ruby/v3.3.11/vm_method.c:1973`). Three gaps follow:

- an undefined name is not checked, where Ruby raises `NameError` "undefined method 'x' for class 'K'";
- `rbFSend(instance, "name")` after the undef answers `undefined` instead of raising `NoMethodError`
  (`rbFSend(instance, "name=", v)` does raise);
- the reader and writer are one descriptor, so `undef_method :name` alone would also drop `name=`.

## Acceptance criteria

- [ ] ruby-compat exports `rbModUndefMethod(klass, ...names)` mirroring `rb_mod_undef_method`, with a
      `@noRailsEquivalent PERMANENT` receipt and the MRI citation, raising `NameError` for an undefined name and
      handling the `name` / `name=` halves of an `rbAttr` accessor separately.
- [ ] `rbFSend` raises `NoMethodError` for an undef'd reader.
- [ ] `removeArgument` calls `rbModUndefMethod` with the name and its `name=` writer, and the inline `defineProperty` is gone.
- [ ] `base.trails.test.ts`'s `.remove_argument` case asserts the reader raises.
