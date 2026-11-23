---
title: "activesupport: Behavior#arity_coerce / arity_of_callable as module members"
status: done
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10607
claim: "2026-11-22T22:24:08Z"
assignee: "activesupport-cache-format-version-accessor-property"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Deprecation::Behavior` defines `arity_coerce` and `arity_of_callable` as private instance methods of the module (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/behaviors.rb:120-146`). `behavior=` and `disallowed_behavior=` call them on `self`. trails#10480 moved `Behavior` into `packages/activesupport/lib/deprecation/behaviors.ts` as a class module, but `arityCoerce` / `arityOfCallable` are still file-level functions there, not members of `Behavior`.

## Acceptance criteria

- [ ] `arityCoerce` and `arityOfCallable` are `@internal` members of `Behavior` (class-module prototype), called as `this.arityCoerce(b)` from the `behavior` / `disallowedBehavior` setters.
- [ ] `parity:api` keeps `deprecation/behaviors.rb` at 100%. The body pins for the two methods are re-pinned.
