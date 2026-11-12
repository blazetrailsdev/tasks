---
title: "ruby-compat rbClassNewInstance builds an instance through a protected constructor for static async new"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: constructors
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 2(a). Every `static async new` needs to construct `this` past a
`protected` constructor, which TypeScript allows only through a cast
(`new (this as unknown as new (...a: never[]) => T)(...args)`). That cast
belongs in one place. MRI's `rb_class_new_instance`
(`vendor/ruby/v3.3.11/object.c:2158`) is allocate plus `initialize`, the same job.

## Acceptance criteria

- [ ] `rbClassNewInstance(klass, ...args)` in ruby-compat, typed so `await Sub.new()` comes back as `Sub`, with an MRI citation.
- [ ] Tests: subclass typing, a protected constructor stays unreachable from outside, args are forwarded.
