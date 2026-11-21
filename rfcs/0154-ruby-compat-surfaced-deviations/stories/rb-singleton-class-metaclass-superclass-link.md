---
title: "ruby-compat: rbSingletonClass's metaclass links to its superclass's metaclass (make_metaclass)"
status: draft
updated: 2026-11-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbSingletonClass` (`packages/ruby-compat/lib/object.ts`, added in trails#10515) ports
`rb_singleton_class` (`vendor/ruby/v3.3.11/class.c:2286`). For a class receiver it answers a
metaclass: a bare `function () {}` whose `prototype` is the class (its statics), flagged
`FL_SINGLETON` and memoized in a WeakMap. MRI's `make_metaclass`
(`vendor/ruby/v3.3.11/class.c:757-790`) also sets the metaclass's superclass to the
superclass's metaclass (`ENSURE_EIGENCLASS(RCLASS_SUPER(klass))`). trails' metaclass has no
superclass link, so `rbClassSuperclass(rbSingletonClass(Sub))` and any ancestry walk over a
metaclass diverge from MRI. Only `ForkTracker.hookBang`'s `prepend` reads it today.

## Acceptance criteria

- `rbSingletonClass(Sub)`'s superclass is `rbSingletonClass(Object.getPrototypeOf(Sub))`, as
  `make_metaclass` sets it, and `rbClassSuperclass` answers it.
- A trails test pins the chain for a two-level class hierarchy.
