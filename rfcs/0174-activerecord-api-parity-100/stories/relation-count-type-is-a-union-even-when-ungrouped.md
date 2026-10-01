---
title: "relation-count-type-is-a-union-even-when-ungrouped"
status: done
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8307
claim: "2026-09-30T22:50:28Z"
assignee: "relation-count-type-is-a-union-even-when-ungrouped"
blocked-by: null
closed-reason: null
---

## Context

`Post.count()` and `Relation#count`
(`packages/activerecord/src/relation/calculations.ts:163`) are typed
`number | Map<unknown, number>` everywhere. Rails' `count(column_name = nil)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:94`)
returns an Integer, or a Hash only when the relation is grouped
(`execute_grouped_calculation`). Every ungrouped caller (`await Post.count()`) has to
narrow a union it can never receive.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

`Relation` carries whether it is grouped in its type. For example, `group(...)`
returns `Relation<T, Grouped>`, and `count` / `sum` / `average` / `minimum` /
`maximum` / `calculate` resolve to the scalar when ungrouped and the `Map` when grouped.
The runtime is unchanged. If that is disproportionate, file the blocker with its specifics
rather than narrowing by cast.

## Acceptance criteria

- [ ] `const n: number = await Post.count()` type-checks.
- [ ] `await Post.group("title").count()` is typed as the `Map`.
