---
title: "prepend() ignores a module's per-instance initializer"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
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

Ruby's `prepend` splices the module into the ancestry above the class
(`rb_prepend_module`, `vendor/ruby/class.c:1430`), so a prepended module that
defines `initialize` and calls `super` runs against every new instance, exactly
as an included one does.

PR #7561 gave `include()` that half — an `initialize` symbol key plus
`initializeIncludedModules(instance)`, which `ActionController::Metal`'s
constructor calls where `metal.rb:210-217` calls `super`. `prepend()` in the
same file (`packages/ruby-compat/src/include.ts`) got nothing: it copies
descriptors onto the prototype and never looks at `[initialize]`, so a prepended
module's per-instance seat is silently inert.

## Converged shape

`prepend()` registers the module's `[initialize]` on the class prototype the way
`include()` does, honoring the same already-present skip. Ordering is the
difference to get right: a prepended module sits ABOVE the class, so its
post-`super` body completes after every included module's, where an included
one completes before a later include's.

## Acceptance criteria

- A module prepended with `prepend()` seats per-instance state as an own
  property at construction.
- Its initializer runs after those of modules included into the same class.
- A re-prepend, or a prepend of a module an ancestor already carries, registers
  one initializer, not two.
- Tests in `packages/ruby-compat/src/include.test.ts` cover all three.
