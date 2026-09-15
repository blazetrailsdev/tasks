---
title: "Converge delegation.ts private scoping helper onto Relation#scoping"
status: claimed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-15T15:50:15Z"
assignee: "await-disconnect-pool-from-pool-manager"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation/delegation.ts` has a module-private `scoping(relation, block)`. It sets and restores `setCurrentScope` synchronously, and for a CollectionProxy it swaps in `relation.scope()` first. Two call sites use it:

- `GeneratedRelationMethods#generateMethod`, the body Rails spells `scoping { model.#{method}(...) }` (`activerecord/lib/active_record/relation/delegation.rb:80-88`).
- `ClassSpecificRelation#methodMissing`, which Rails spells `scoping { model.public_send(method, ...) }` (`delegation.rb:128`).

Both Rails bodies call `Relation#scoping` (`activerecord/lib/active_record/relation.rb`, `def scoping(all_queries: nil, &block)` → `_scoping`). trails' `Relation#scoping` (`relation.ts`) is `async` and always returns a Promise. A synchronous class method delegated through it would change its return type, so the port grew this second, synchronous copy instead.

## Acceptance criteria

- Both call sites call `this.scoping(() => ...)`, the ported `Relation#scoping`, with the same `all_queries`/registry handling as `relation.rb`. The private helper is deleted.
- If that means `Relation#scoping` has to return its block's value synchronously when the block is synchronous, converge `_scoping` so it does. Do not keep two scoping implementations.
- The relation/association delegation tests stay green.
