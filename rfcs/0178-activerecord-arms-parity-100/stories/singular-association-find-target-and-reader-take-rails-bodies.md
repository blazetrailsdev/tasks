---
title: "activerecord: SingularAssociation#find_target and #reader take Rails' bodies"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activerecord-converge-invented-control-flow-arms-associations-part-5`. Two `SingularAssociation` bodies in `packages/activerecord/src/associations/singular-association.ts` keep branches Rails lacks and carry `@inventedArm … — CONVERGEABLE` receipts pointing here.

`find_target` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/singular_association.rb:47-57`) is:

```ruby
def find_target(async: false)
  if disable_joins
    if async
      scope.load_async.then(&:first)
    else
      scope.first
    end
  else
    super.then(&:first)
  end
end
```

The trails body is a separate loader: it re-reflects the association off the owner's class and raises `AssociationNotFoundError`, resolves a polymorphic `belongs_to` target class by hand, returns `null` when any owner key column is null, and picks between `_loadSingularViaStatementCache` and `_builtAssociationScope(...).take()`. It cannot call `super`, because `Association#findTarget` (`packages/activerecord/src/associations/association.ts`) is a stub returning `null` where Rails' `Association#find_target` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:226-251`) holds the strict-loading check, the `AssociationScope` statement-cache lookup and the `set_inverse_instance` pass. The arms report filed it as `+throw +if +if +if +if +loop +if +if +if`.

`reader` (`singular_association.rb:7-15`) is `reload` under `if !loaded? || stale_target?`, then `target`. The trails getter adds `if (reloaded instanceof Promise) return reloaded.then(() => this.target)`, because `reload` answers a promise when it has to query.

## Acceptance criteria

- [ ] `Association#findTarget` is the port of `association.rb:226-251`, and `SingularAssociation#findTarget` is the `disable_joins` / `async` / `super.then(&:first)` body above, with the hand-written loader and its helpers in `associations.ts` deleted or moved to where Rails has them.
- [ ] `SingularAssociation#reader` has no `instanceof Promise` arm.
- [ ] The four `@inventedArm` receipts naming this story are deleted and `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no row for either method.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord --direction=invented && pnpm parity:api:arms:throws
```
