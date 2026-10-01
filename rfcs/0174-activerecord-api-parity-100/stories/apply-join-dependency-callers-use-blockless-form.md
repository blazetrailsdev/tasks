---
title: "apply_join_dependency: move Rails' blockless callers onto the blockless arm"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
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

PR 8357 restored `apply_join_dependency`'s `if block_given? … else relation` arm
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:480-484`); the
blockless form returns `stripThenable(relation)` (`packages/activerecord/src/relation.ts`,
`applyJoinDependency`). Only `updateAll` / `deleteAll` were moved onto it. Rails' other blockless
callers still pass an invented block in trails:

- `relation/finder_methods.rb:370` `relation = apply_join_dependency(eager_loading: false)` (`construct_relation_for_exists`); trails `relation/finder-methods.ts` passes a block.
- `relation/calculations.rb:232,310,386` (`calculate` / `pluck` / `ids`).
- `relation.rb:481` `collection = eager_loading? ? apply_join_dependency : self`.
- `relation/query_methods.rb:1789` `opts.send(:apply_join_dependency)`.

The `FinderMethodsHost` declaration in `relation/finder-methods.ts` also still types the block as
required and the return as `Promise<R>`.

## Acceptance criteria

- [ ] Each Rails blockless call site calls `applyJoinDependency` with no block and continues on the returned relation, in Rails' statement order.
- [ ] The host declaration in `relation/finder-methods.ts` carries both overloads.
- [ ] `pnpm parity:api:calls:args` stays green.
