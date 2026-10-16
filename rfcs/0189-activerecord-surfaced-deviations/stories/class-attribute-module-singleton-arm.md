---
title: "activesupport: ClassAttribute.redefine skips Rails' attached-module arm, so a module's singleton-class callback chain cannot run"
status: done
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: [activesupport, ruby-compat]
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: trails#8985
claim: "2026-10-16T17:09:05Z"
assignee: "class-attribute-module-singleton-arm"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ClassAttribute.redefine` (`vendor/rails/v8.0.2/activesupport/lib/active_support/class_attribute.rb:6-13`) has two arms for a singleton-class owner:

```ruby
if owner.singleton_class?
  if owner.attached_object.is_a?(Module)
    redefine_method(owner, namespaced_name, private: true) { value }
  else
    redefine_method(owner, name) { value }
  end
end
```

trails ports only the second (`packages/activesupport/src/class-attribute.ts:17-20`: `if (rbModSingletonP(owner)) redefineMethod(owner.prototype, name, …)`). The first arm is what lets a module object answer its own class attribute through the private namespaced reader. CLAUDE.md § "`singleton_class` is a per-object subclass" records the arm as unported because a JS class has no metaclass, but that covers a class receiver only. A ruby-compat `Module` instance is a plain object, and `rbObjSingletonClass` already gives it a real singleton class (`Module#extendObject`, `packages/ruby-compat/src/include.ts:613`).

It is reached by `ActiveJob::Callbacks` (`vendor/rails/v8.0.2/activejob/lib/active_job/callbacks.rb:22-25`): `class << self; include ActiveSupport::Callbacks; define_callbacks :execute; end`, run by `ActiveJob::Callbacks.run_callbacks(:execute)` (`execution.rb:27`). Ported as `include(rbObjSingletonClass(Callbacks), ActiveSupport.Callbacks)` plus `defineCallbacks("execute")` on that singleton class, the chain is built, but `Callbacks.runCallbacks("execute")` throws `TypeError: Cannot read properties of undefined (reading 'execute')` because `Callbacks.__callbacks` is undefined (probe in the audit `module-singleton-callbacks-20261016T164539Z`).

Scope: the Module-instance half only. The draft `class-receiver-singleton-class` (0082) keeps the class-receiver metaclass and the removal of the CLAUDE.md limitation paragraph.

## Acceptance criteria

- [ ] ruby-compat ports `Class#attached_object` as `rbClassAttachedObject` (`vendor/ruby/v3.3.11/class.c:1707-1714`), raising `TypeError` for a non-singleton class, with unit tests.
- [ ] `ClassAttribute.redefine` takes the `attached_object.is_a?(Module)` arm when `rbModSingletonP(owner)` and the attached object is a ruby-compat `Module`: the private `namespacedName` reader on `owner.prototype`. Other singleton owners keep the current arm.
- [ ] `activesupport/test/core_ext/class/attribute_test.rb:135` "works well with module singleton classes" is ported under its Rails name and passes.
- [ ] A test: a `new Module()` whose singleton class includes `ActiveSupport.Callbacks` defines, sets and runs a `:execute` chain through the module object.
- [ ] The CLAUDE.md sentence is narrowed so the arm is unported only for a JS-class receiver.

## Verification

```bash
pnpm vitest run packages/activesupport/src/class-attribute packages/activesupport/src/callbacks packages/ruby-compat/src/object && pnpm parity:api:calls
```
