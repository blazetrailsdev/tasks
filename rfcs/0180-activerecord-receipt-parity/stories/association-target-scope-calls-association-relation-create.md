---
title: "activerecord: Delegation.create forwards its arguments so target_scope can call AssociationRelation.create"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
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

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`Association#target_scope` is one line
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:312-314`):

```ruby
def target_scope
  AssociationRelation.create(klass, self).merge!(klass.scope_for_association)
end
```

`packages/activerecord/src/associations/association.ts` `targetScope` open-codes the constructor —
`new (relationClassFor.call(ActiveRecord.AssociationRelation, klass))(klass, this)` — and carries
`@missingRailsCall create`, because trails' `create`
(`packages/activerecord/src/relation/delegation.ts:170`) cannot forward a second positional argument.
Rails' forwards everything (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:139-141`):

```ruby
def create(model, ...)
  relation_class_for(model).new(model, ...)
end
```

trails' takes `(model, kwargs = {})` and destructures `table` / `predicateBuilder` into POSITIONAL
constructor arguments, where `Relation#initialize` takes them as keywords
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:77`) and `AssociationRelation#initialize`
is `(klass, association, **)` (`association_relation.rb:5-8`). `collection-proxy.ts` and
`disable-joins-association-scope.ts` open-code the same `relationClassFor.call(…)` constructor.

`targetScope` also guards a missing `klass` and a missing `scopeForAssociation`; Rails has neither guard.

## Acceptance criteria

- [ ] `create(model, ...args)` forwards its arguments to `new (relationClassFor.call(this, model))(model, ...args)`; `Relation`'s constructor takes `table` / `predicateBuilder` / `values` as an options object, as `relation.rb:77` does.
- [ ] `targetScope` is `ActiveRecord.AssociationRelation.create(klass, this).mergeBang(klass.scopeForAssociation())` with no invented guard.
- [ ] The `@missingRailsCall create` receipt is deleted; `pnpm parity:api:calls` and `:calls:args` green with no new row.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activerecord/src/associations/association-relation.trails.test.ts
```
