---
title: "Move the scope/options shuffle out of Builder::Association.build into the macros"
status: ready
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Builder::Association.build(model, name, scope, options, &block)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/association.rb:25-38`) takes `scope` as a callable or `nil` and goes straight to the `dangerous_attribute_method?` check. It never inspects whether `scope` is a Hash. Ruby separates the scope from the options at the macro signature, for example `has_many(name, scope = nil, **options, &extension)` in `associations.rb`.

`packages/activerecord/src/associations/builder/association.ts` `build` adds an arm Rails does not have. It types `scope` as `fn | null | Record<string, unknown>`, then when `scope` is a plain object it moves it into `options` and sets `scope = null`. That union is also why `createReflection` still needs `scope as ((...args: any[]) => any) | null` after trails#9127. TS cannot narrow the reassigned parameter: the `Array.isArray` and `instanceof Function` guards leave `Record & any[]` and `Record & Function` arms (TS2322 when tried with a local).

## Converged shape

- The `(name, scope?, options?)` disambiguation lives in the macro methods (`hasMany` / `hasOne` / `belongsTo` / `hasAndBelongsToMany` in `associations.ts`), which is where Ruby's signature performs it.
- `Builder::Association.build` takes `scope: ((...args: any[]) => any) | null` and has no Hash check, line for line with `association.rb:25-38`.
- The `scope as …` cast in `build` → `createReflection` is gone.

## Acceptance criteria

- [ ] `build` has no scope/options shuffle; its `scope` parameter type excludes `Record`.
- [ ] Each macro caller does the disambiguation, following the "optional positional before trailing options" rule in the root CLAUDE.md (no `typeof` overload in `build`).
- [ ] The `scope as` cast in `builder/association.ts` is removed; typecheck and `parity:api:calls` / `:args` are green.
