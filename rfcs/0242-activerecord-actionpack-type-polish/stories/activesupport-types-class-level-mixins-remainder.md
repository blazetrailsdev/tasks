---
title: "activesupport class-level mixins: last 12 any/double-cast hits"
status: draft
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10340 brought the class-level mixin files down from 44 to 12 hits. The 12 left:

- `packages/activesupport/lib/rescuable.ts:17,34`: `ErrorHandler` is `(this: any, error: any) => unknown`. A handler typed for a specific error subclass or `this` cannot be assigned to `unknown` parameters under strictFunctionTypes. Rails: `vendor/rails/v8.0.2/activesupport/lib/active_support/rescuable.rb` (`rescue_from` with `with:` or a block).
- `rescuable.ts:~159`: `(Rescuable as unknown as { included(...) })`. `extend(Rescuable, Concern)` does not surface `included` in the type of `Rescuable`.
- `current-attributes.ts:~126,200,201`: an abstract `new (this as unknown as …)()`, and `methodMissingPrototype`, which cannot see a private static `methodMissing`.
- `callbacks.ts:247,249,269`: `ProcCall` / `call` receivers are typed `(...args: any[]) => unknown`. `callbacks.ts:~1283`: `this as unknown as AnyClass`.

## Acceptance criteria

- [ ] `grep -Po ': an|as an|as unknown as' class-attribute.ts callbacks.ts current-attributes.ts rescuable.ts module-ext.ts | wc -l`, run from `packages/activesupport/lib`, falls from 12 to ≤ 4.
- [ ] `extend()` with `Concern` types its `included` hook, so `rescuable.ts` needs no double cast.
- [ ] No Rails names or control flow change.
