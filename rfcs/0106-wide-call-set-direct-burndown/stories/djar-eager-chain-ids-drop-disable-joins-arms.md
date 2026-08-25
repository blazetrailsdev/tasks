---
title: "DisableJoinsAssociationScope plucks chain ids eagerly; drop CollectionProxy's disableJoins arms"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6613
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DisableJoinsAssociationScope#scope`
(`vendor/rails/activerecord/lib/active_record/associations/disable_joins_association_scope.rb`)
walks the through-chain and plucks the intermediate ids EAGERLY, so the
`DisableJoinsAssociationRelation` it returns already carries
`key IN (ids)`. That makes `Association#scope` authoritative for a
`disable_joins` association: `CollectionProxy`'s inherited
`Calculations#calculate` / `#pluck` — whose `spawn` is delegated to
`scope` (`collection_proxy.rb:1128-1137`) — compute against a
constrained relation with no override needed.

trails' `DisableJoinsAssociationScope` defers the chain walk (the
intermediate plucks are async), so
`packages/activerecord/src/disable-joins-association-relation.ts` returns
a relation with NO constraint until it is awaited. Consequences shipped
in PR for `collection-proxy-calculations-to-two-overrides`:

- `DisableJoinsAssociationRelation` carries `count`, and now `calculate`
  and `pluck`, overrides that run `_walkOnce()` +
  `_composeChainedState()` before delegating. Rails has none of these.
- `CollectionProxy#calculate` and `#pluck`
  (`packages/activerecord/src/associations/collection-proxy.ts`) each
  carry a third arm — `if (this._assocDef.options.disableJoins) return
this.scope()...` — on top of Rails' two-arm
  `null_scope? ? scope... : super` (`collection_proxy.rb:724-730`).
  Without it `super` calculates over the whole table (measured: 14 rather
  than 3 in `HasManyThroughDisableJoinsAssociationsTest > counting on
disable joins through`).

## Acceptance criteria

- [ ] `CollectionProxy#calculate` / `#pluck` are Rails' two-arm bodies
      with no `disableJoins` arm.
- [ ] `DisableJoinsAssociationRelation` sheds the `count` / `calculate` /
      `pluck` overrides Rails does not have (or the deviation is
      re-scoped to whatever genuinely needs the async walk).
- [ ] `has-many-through-disable-joins-associations.test.ts` and
      `cp-count-disable-joins-through.test.ts` green on SQLite,
      PostgreSQL and MySQL/MariaDB.
