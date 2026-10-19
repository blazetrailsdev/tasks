---
title: "Type Relation.model as a constructor of T so _new/_create drop their casts"
status: draft
updated: 2026-10-19
rfc: "0198-activerecord-mixin-host-typing"
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

After trails#9104, `packages/activerecord/src/relation.ts` `_new` / `_create` /
`_createBang` still narrow `block` to `((record: Base) => void) | undefined` and
cast the result to `T` / `Promise<T>`. The cause is that `Relation<T>.model` is typed
`typeof Base`, not a constructor of `T`. Rails is
`klass.new(attributes, &block)` / `klass.create(...)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`, `_new` / `_create` / `_create!`).
`execExplain(() => (this._relation as unknown as { execQueries() }).execQueries())`
(relation.ts ~199) is the same kind of cast: a protected member reached from a
sibling class.

## Acceptance criteria

- [ ] `Relation.model` / `_model` carry a model-class type whose instances are `T`, e.g. `typeof Base & (new (...a: any[]) => T)`, so `_new` / `_create` / `_createBang` need no casts.
- [ ] Typing only: no runtime change and no extra public surface (`pnpm parity:api:extra:gate` green).
- [ ] `pnpm typecheck` green.
