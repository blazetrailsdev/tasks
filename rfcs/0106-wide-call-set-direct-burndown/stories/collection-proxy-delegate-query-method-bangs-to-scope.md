---
title: "collection-proxy-delegate-query-method-bangs-to-scope"
status: blocked
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-16T13:45:03Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: "Prerequisite PR #6595 (collection-proxy-delegate-query-methods-to-scope, the NON-bang half) is still OPEN, not merged into main. This story's context assumes _finderScope/findTake/findTakeWithLimit are already deleted; on main they still exist (collection-proxy.ts:824, :2400, :2409). Building the bang half now would require stacking on #6595 and would conflict file-for-file. Unblock once #6595 merges."
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
