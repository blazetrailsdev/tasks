---
title: "ruby-compat rbClassNewInstance builds an instance through a protected constructor"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: gate
packages: [ruby-compat]
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

RFC § Design 2(a). A `static async new` must construct `this` past a
`protected` constructor, which TypeScript allows only through a cast
(`new (this as unknown as new (...a: never[]) => T)(...args)`). The cast
belongs in one place. MRI's `rb_class_new_instance`
(`vendor/ruby/v3.3.11/object.c:2158`) is allocate plus `initialize`, the same
job.

## Acceptance criteria

- [ ] `rbClassNewInstance(klass, ...args)` in ruby-compat with the MRI citation, typed so a subclass's `await Sub.new()` is `Sub`.
- [ ] Tests: argument forwarding; a `@ts-expect-error` proving `new Klass()` from outside stays a type error; and two subclass cases, recorded as type tests and runtime tests: a subclass with only a synchronous constructor inherits `static new` without re-declaring it and resolves to its own type and `instanceof`, and a subclass that overrides `static async new` and calls `super.new(...)` runs the parent's async half before its own.
