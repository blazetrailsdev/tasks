---
title: "Relation query-methods types without any"
status: done
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#10350
claim: "2026-11-19T11:01:32Z"
assignee: "activesupport-types-class-level-mixins-remainder"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/lib/relation/query-methods.ts` holds 126 of
activerecord `lib/`'s `any` / `as any` / `as unknown as` hits, the most of any
file. Most are `args: any` on the `where` / `order` / `select` / `joins`
family and `this: any` on bang methods. Rails:
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb`.

## Acceptance criteria

- [ ] Hits in the files above fall from 126 to ≤ 38 (at least 70%).
- [ ] Each `args: any` becomes the argument union the Rails method accepts
      (string, hash, Arel node, array) or `unknown[]` plus narrowing.
- [ ] `this` is `Relation<T>` (or the host interface), so a chain keeps `T`.
- [ ] A new `dx-tests/query-chaining.test-d.ts` case shows a chained
      `where(...).order(...)` keeps the model type.

## Verification

Count hits from `packages/activerecord/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' relation/query-methods.ts | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
