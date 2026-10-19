---
title: "ruby-compat: extend through a plain module reaches a class helper's inherited instance methods"
status: draft
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
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

`extendObject` in `packages/ruby-compat/src/include.ts`, in the arm added by
trails#9063, extends an object with a class helper that a plain-object module
recorded. It copies only the own descriptors of `nested.prototype`. In Ruby,
`rb_extend_object` → `rb_include_module` (`vendor/ruby/v3.3.11/class.c:1179`,
`include_modules_at` :1253) makes the whole method ancestry reachable from the
singleton class. So a class helper that extends another class loses its
inherited instance methods here.

## Acceptance criteria

- The arm walks `nested.prototype`'s chain up to `Object.prototype`, copying
  each instance method that a nearer link does not already define.
- An `include.test.ts` case covers a class helper whose instance method is
  inherited from its superclass, and checks that it is reachable after
  `extend({}, plainModuleIncludingIt)`.
