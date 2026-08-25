---
title: "collection-proxy-delegate-query-method-value-readers-to-scope"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6612
claim: "2026-08-16T20:33:34Z"
assignee: "collection-proxy-delegate-query-method-value-readers-to-scope"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy` has NO `update_all` — it inherits `Relation#update_all`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1010-1027`), which reads
`where_clause` / `values` / `having_clause`. Those are QueryMethods public
instance methods generated at
`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:162-183`,
so `delegate(*delegate_methods, to: :scope)`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`)
routes them to `@association.scope`
(`collection_proxy.rb:949-950`). That is how the inherited mutation terminal
respects the association scope with no override.

trails' `CollectionProxy` owns its inherited `Relation` state instead (the ctor
seeds it via `Relation.prototype.noneBang` / `initializeCopy`, load-bearing for
`toSql()`), so the value readers can NOT be delegated. PR for
`collection-proxy-mutation-terminals-through-scope` therefore routed the
TERMINAL through `scope()` — a `CollectionProxy#updateAll` override tagged
`@noRailsEquivalent` in
`packages/activerecord/src/associations/collection-proxy.ts`.

## Converged shape

Delegate the QueryMethods VALUE READERS (`whereClause`, `havingClause`,
`values`, the `*Value` / `*Values` readers) to `scope()` the way Rails does,
so the inherited `Relation#updateAll` reads the association scope with no
`CollectionProxy` override at all, and delete the `updateAll` override. This
requires first untangling what the proxy's own seeded relation state is used
for (`toSql()`, `arel`), since delegating the readers moves those onto `scope`
too.

## Acceptance criteria

- [ ] `CollectionProxy#updateAll` and its `@noRailsEquivalent` tag are deleted.
- [ ] The QueryMethods value readers on `CollectionProxy` resolve through
      `scope()` (collection_proxy.rb:1128-1137).
- [ ] `CollectionProxy — mutation terminals invoked on the proxy itself on
stale new-owner seed` and `HasManyAssociationsTest > update all respects
association scope` stay green on SQLite, PostgreSQL and MySQL/MariaDB.
