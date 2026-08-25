---
title: "collection-proxy-delegate-query-method-bangs-to-scope"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6601
claim: "2026-08-16T17:45:07Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

PR for `collection-proxy-delegate-query-methods-to-scope` converged the
NON-bang half of Rails' delegation
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`):
`CollectionProxy.prototype` now forwards `where` / `limit` / `order` /
`reverseOrder` / … and the `SpawnMethods` set to `scope()`, which let
`_finderScope()`, `findTake` and `findTakeWithLimit` be deleted.

`QueryMethods.public_instance_methods(false)` also contains the bang builders
(`where!`, `limit!`, `none!`, …), and Rails delegates those to `scope` too — a
Rails `CollectionProxy` owns no relation state of its own. trails' proxy does:
its constructor seeds the inherited `Relation` state through `noneBang()` /
`extendingBang()` / `_copyStateFrom()` (`collection-proxy.ts` ctor), and
`toSql()` / `toArray()` / `deleteAll()` / the calculation overrides read that
state back through `_cpMutated` (`_installMutationTracker`,
`_relationStateDiverged`). Delegating the bangs today would send the ctor's own
seed to the memoized scope.

## Acceptance criteria

- [ ] The bang half of `QueryMethods` / `SpawnMethods` (`whereBang`, `limitBang`,
      `noneBang`, `mergeBang`, …) delegates to `scope()`, per
      `collection_proxy.rb:1128-1137`.
- [ ] `_installMutationTracker`, `_cpMutated` and `_relationStateDiverged` are
      deleted, along with the divergence branches in `toArray` / `_execLoad` /
      `deleteAll` / `count` / `sum` / `minimum` / `maximum` / `average` / `pluck`.
- [ ] `_seededNoneNewOwner` / `_maybeRebaseProxySeed` / the
      `CollectionProxy#_isEmptyRelation` override delete with it.
- [ ] Association tests stay green on SQLite, PostgreSQL and MySQL/MariaDB.
