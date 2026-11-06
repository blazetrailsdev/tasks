---
title: "A JS function does not answer Proc#arity or method(:call) in ruby-compat"
status: draft
updated: 2026-11-06
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mapper::Constraints#constraint_args`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:66-71`) is
`constraint.respond_to?(:arity) ? constraint.arity : constraint.method(:call).arity`.
A Ruby Proc answers `arity`. In ruby-compat, `rbObjRespondTo(fn, "arity")` is
false for a JS function, and `rbObjMethod(fn, "call")` resolves
`Function.prototype.call` (`packages/ruby-compat/src/method.ts:137-141`), so
trails#9782 added an `rbObjIsProc(constraint) ? constraint.length` arm under
`@inventedArm length — PERMANENT` in
`packages/actionpack/src/action-dispatch/routing/mapper.ts` `constraintArgs`.

## Acceptance criteria

- ruby-compat answers `Proc#arity` for a function (`rbObjRespondTo(fn, "arity")` true, with `proc_arity`, `vendor/ruby/v3.3.11/proc.c`, semantics) and `rbObjMethod(proc, "call")` is the proc's own `call`.
- `constraintArgs` drops the `rbObjIsProc` arm and its receipt; mapper tests stay green.
