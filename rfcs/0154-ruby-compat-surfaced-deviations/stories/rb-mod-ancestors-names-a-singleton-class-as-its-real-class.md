---
title: "rbModAncestors and rbModInstanceMethod name a singleton class as the object's real class"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced fixing red main in trails#8369.

Ruby's `obj.singleton_class.ancestors` begins with the singleton class itself and then the object's class (`vendor/ruby/v3.3.11/class.c:1570` `rb_mod_ancestors` walks `RCLASS_SUPER` from the receiver), and `singleton_class.instance_method(:m).owner` is the singleton class when `m` was defined on it (`vendor/ruby/v3.3.11/proc.c:1988` `method_owner`).

trails: `rbObjSingletonClass` (`packages/ruby-compat/src/object.ts`) sets the singleton class's `prototype.constructor` back to the real class so `obj.constructor` keeps answering Ruby's `obj.class` (CLAUDE.md, "`singleton_class` is a per-object subclass"). `rbModAncestors` and `rbModInstanceMethod` (`packages/ruby-compat/src/include.ts`) both name the class of a prototype link by its own `constructor`, so for a singleton class `s` of a `T` instance:

- `rbModAncestors(s)` is `[T, T, Object, "Kernel", "BasicObject"]` (measured) where Ruby answers `[s, T, ...]`.
- `rbModInstanceMethod(s, mid).owner` is `T` for a method defined on `s.prototype`.

The link already carries the answer: `rbObjSingletonClass` stamps `s.prototype[FL_SINGLETON] = s`.

No caller reads either on a singleton class today.

## Acceptance criteria

- `rbModAncestors` and `rbModInstanceMethod` name a link carrying an own `FL_SINGLETON` by that singleton class, and every other link by its `constructor` as now.
- `rbModAncestors(rbObjSingletonClass(obj))` is `[singleton, obj.constructor, ...]`.
- `rbModInstanceMethod(singleton, mid).owner` is the singleton class for a method defined on it and the real class for an inherited one.
- Tests beside the existing `rbModAncestors` cases in `packages/ruby-compat/src/include.test.ts`.
