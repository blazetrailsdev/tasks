---
title: "ConnectionHandling: with_role_and_shard checks is_a? ActiveRecord::Relation and returns the relation, not a load/toArray duck type"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8116
claim: "2026-09-25T22:32:07Z"
assignee: "bound-sql-literal-enumerable-arm-is-a-closed-type-list"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8060, which replaced sanitization's `isRelationLike` duck type with the Rails
`ActiveRecord::Relation === value` check. A sibling duck type remains in
`packages/activerecord/src/connection-handling.ts` (`isRelationLike`, `typeof load === "function" && typeof toArray === "function"`),
used by `withRoleAndShard`.

Rails `with_role_and_shard` (`vendor/rails/activerecord/lib/active_record/connection_handling.rb:393-402`):

```ruby
append_to_connected_to_stack(role: role, shard: shard, prevent_writes: prevent_writes, klasses: [self])
return_value = yield
return_value.load if return_value.is_a? ActiveRecord::Relation
return_value
ensure
  self.connected_to_stack.pop
```

Two divergences:

1. The check is a duck type, so any object with both `load` and `toArray` is loaded. Rails checks `is_a? ActiveRecord::Relation`.
   Converged shape: `result instanceof ActiveRecord.Relation`, read at call time from the autoloaded
   `ActiveRecord` namespace (`namespaces.ts`, CLAUDE.md § "Call-time constant resolution"), the same shape as
   `sanitization.ts`'s `replaceBindVariable` after #8060.
2. Rails calls `load` for its side effect and returns `return_value`, the Relation itself (now loaded).
   trails returns the result of `load()`. Converged shape: await/settle the `load()` inside the stack entry, then return the relation.
   `load` is async in trails, so the stack pop still has to be deferred until the load settles (the existing `withCleanup`).
   Watch the thenable trap: returning a Relation from a promise chain unwraps it via `then` (CLAUDE.md § "`Relation` is evaluated by an async query").
   If that forces a divergence, receipt it at the call site with the Rails cite.

## Acceptance criteria

- `isRelationLike` in `connection-handling.ts` is deleted, and `withRoleAndShard` tests `instanceof ActiveRecord.Relation`.
- The return value matches Rails (a loaded relation, not the load result), or any deviation forced by the thenable is receipted at the call site.
- `connected_to` tests in `connection-handling.test.ts` / `connection-handlers-multi-db` stay green on all three adapters.
