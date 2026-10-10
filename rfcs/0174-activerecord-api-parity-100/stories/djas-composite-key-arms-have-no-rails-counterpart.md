---
title: "djas-composite-key-arms-have-no-rails-counterpart"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8343. Rails' `DisableJoinsAssociationScope#last_scope_chain`
seeds the walk with one read
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/disable_joins_association_scope.rb:19-20`):

```ruby
first_item = reverse_chain.shift
first_scope = [first_item, false, [owner._read_attribute(first_item.join_foreign_key)]]
```

trails' `lastScopeChain`
(`packages/activerecord/src/associations/disable-joins-association-scope.ts`) carries a second arm
Rails does not have: when `joinForeignKey` is an Array it maps each column through
`owner._readAttribute` and seeds a tuple. The same shape recurs in
`DisableJoinsAssociationRelation#load`
(`packages/activerecord/src/disable-joins-association-relation.ts`), whose `recordKey` maps an Array
`key` where Rails calls `record[key]` (`disable_joins_association_relation.rb:30-32`), and in
`new DeferredPluck(records, [foreignKey].flat())` where Rails calls `records.pluck(foreign_key)`
(`disable_joins_association_scope.rb:26-27`).

In Rails 8.0.2 `_read_attribute` with an Array name answers `nil`, so a composite-key
`disable_joins: true` through association is not supported upstream. The trails arms are pinned by
`disable-joins-composite-key.trails.test.ts` and `disable-joins-composite-nested.trails.test.ts`.

## Acceptance criteria

- [ ] Decide, against vendored Rails, whether composite-key `disable_joins` is supported. If it is
      not, `lastScopeChain` reads `owner._readAttribute(firstItem.joinForeignKey)` in one call, and
      `load` reads `record[key]`, with the composite arms and their trails-only tests removed.
- [ ] If a later Rails supports it, port that version's body instead and cite it.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
