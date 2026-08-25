---
title: "Retire the CollectionProxy _queryExecutor flag; mutated loads run AssociationRelation#exec_queries"
status: draft
updated: 2026-08-08
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
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

Surfaced by #6236. `CollectionProxy#_findTargetViaAssociation`
(`packages/activerecord/src/associations/collection-proxy.ts`) sets
`HasManyAssociation#_queryExecutor` — a trails-only field
(`packages/activerecord/src/associations/has-many-association.ts`) that makes
`find_target` run the proxy's own mutated Relation instead of rebuilding the
association scope, and that
`HasManyThroughAssociation#findTarget` must special-case with an early
`if (this._queryExecutor) return super.findTarget();` so the through routing does
not discard it.

Rails needs no such field because its `CollectionProxy` **is** the relation: a
mutated proxy (`.where(...)`, `.order(...)`) is an `AssociationRelation`, and
loading it runs `AssociationRelation#exec_queries`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb`,
`vendor/rails/activerecord/lib/active_record/relation.rb`) — it never re-enters
`Association#find_target` (`association.rb:248`) at all. The unmutated proxy
delegates to `CollectionAssociation#load_target`
(`collection_association.rb:272`), which is the only path that reaches
`find_target`. Our version routes both through `find_target` and then has to
carry a flag to undo half of it.

## Converged shape

- The diverged (`_cpMutated`) load runs `AssociationRelation#exec_queries`
  directly, without entering `find_target`, mirroring Rails' split; the
  unmutated load keeps going through the association holder's `find_target`.
- `HasManyAssociation#_queryExecutor` and the `queryExecutor` parameter of the
  module-private loader in `has-many-association.ts` are deleted.
- `HasManyThroughAssociation#findTarget`'s `if (this._queryExecutor) return
super.findTarget();` early return is deleted, restoring the Rails body
  (`has_many_through_association.rb:225-231`).

## Acceptance criteria

- [ ] No `_queryExecutor` field or loader parameter remains.
- [ ] `HasManyThroughAssociation#findTarget` has no executor branch.
- [ ] `collection-proxy.test.ts`, the mutated-proxy (`whereBang` / `orderBang`)
      suites, and `has-many-associations.test.ts` pass with no test renames.
