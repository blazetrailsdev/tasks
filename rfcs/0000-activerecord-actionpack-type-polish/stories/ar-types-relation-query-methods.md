---
title: "Relation query-methods types without any"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/lib/relation/query-methods.ts` holds 109 of
activerecord `lib/`'s `any` / `as any` / `as unknown as` hits, the most of any
file. Most are `args: any` on the `where` / `order` / `select` / `joins`
family and `this: any` on bang methods. Rails:
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb`.

## Acceptance criteria

- [ ] Hits in `relation/query-methods.ts` fall by at least 70%.
- [ ] Each `args: any` becomes the argument union the Rails method accepts
      (string, hash, Arel node, array) or `unknown[]` plus narrowing.
- [ ] `this` is `Relation<T>` (or the host interface), so a chain keeps `T`.
- [ ] A new `dx-tests/query-chaining.test-d.ts` case shows a chained
      `where(...).order(...)` keeps the model type.

## Definition of done

Renaming a parameter or splitting a method to ease typing does not count.
