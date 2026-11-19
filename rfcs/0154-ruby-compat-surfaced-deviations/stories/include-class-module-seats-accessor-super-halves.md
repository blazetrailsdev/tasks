---
title: "include() of a class module seats super only for value descriptors, not get/set"
status: draft
updated: 2026-11-19
rfc: "0154-ruby-compat-surfaced-deviations"
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

`include()` copying a class module (`packages/ruby-compat/lib/include.ts`, the
`!existing || existingIsMixin` arm near line 1598) seats a `super` slot only for
the descriptor's `value`: `rbSeatSuper(klass.prototype, key, modDesc.value, descriptors)`.
The ancestor-walk arm a few dozen lines below (around line 1672) seats all three
halves: `value`, `get` and `set`. So a class module's accessor whose body calls
`rbCallSuper(this, getter)` or `rbCallSuper(this, setter, v)` raises
"super: no superclass method" when the includer already answers that name.
Ruby resolves `super` from an `attr_writer` / `def x=` the same way as from any
other method (`rb_call_super`, `vendor/ruby/v3.3.11/vm_eval.c:366`).

Found on trails#10358 while trying to convert `Integration::Runner` to a class
module: `assertions=`'s `super` (actionpack `integration.rb`'s `Runner#assertions=`)
was unseated. That conversion was reverted for another reason.

## Acceptance criteria

- The class-module copy arm also calls `rbSeatSuper(..., modDesc.get, ..., "get")` and
  `rbSeatSuper(..., modDesc.set, ..., "set")`, as the ancestor-walk arm does.
- A ruby-compat test in `test/include.test.ts` includes a class module that defines a
  getter/setter over a class already defining them, and `rbCallSuper` from both halves
  reaches the class's accessor.
