---
title: "CollectionProxy#scope memoizes as @scope ||= @association.scope, with Rails' two reset_scope callers (collection_proxy.rb:949-950)"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6609
claim: "2026-08-16T19:53:31Z"
assignee: "collection-proxy-calculations-to-two-overrides"
blocked-by: null
closed-reason: null
---

## Context

Rails memoizes the association scope at TWO levels:

- `Association#association_scope`
  (`vendor/rails/activerecord/lib/active_record/associations/association.rb`)
  memoizes `@association_scope`, cleared by `reset_scope`.
- `CollectionProxy#scope`
  (`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:949-950`)
  is `@scope ||= @association.scope`, cleared by `CollectionProxy#reset_scope`.

Two callers clear them: `CollectionAssociation#reader`
(`collection_association.rb:42`) runs `@proxy.reset_scope` on EVERY
collection read, and `save_collection_association`
(`autosave_association.rb:428`) runs `association.reset_scope` on the
owner's save.

trails collapses both memos into one field, `CollectionProxy#_scope`
(`packages/activerecord/src/associations/collection-proxy.ts`), and has no
`reader` seam at all — the accessor in `associations.ts` returns the
cached proxy directly. PR #6601 made the bang builders delegate to
`scope()`, which meant a `whereBang` on a proxy whose owner is still a new
record forced the unresolved-FK `1=0` scope into that single memo, reding
`HasManyAssociationsTest > update all respects association scope`. The
shipped workaround is a branch in `scope()` that skips memoization
entirely (on the proxy AND on the association) while
`this._record.isNewRecord()`.

That branch has no Rails counterpart. It is a stand-in for the two
`reset_scope` callers trails is missing, and it means a new-owner proxy
rebuilds its scope on every single call rather than memoizing as Rails
does.

## Converged shape

Restore the two reset points Rails has, then drop the `isNewRecord()`
branch and memoize unconditionally as `@scope ||= @association.scope`
does:

- the collection reader (`associations.ts`, the accessor that returns the
  proxy) calls `proxy.resetScope()` per `collection_association.rb:42` —
  it already calls `resetScope()` on one path (`associations.ts:1802`);
  confirm it covers every read.
- `Association#resetScope` cascades to the proxy, or
  `autosave-association.ts:243`'s existing `association.resetScope()` call
  is paired with a proxy reset, per `autosave_association.rb:428`.

Splitting `_scope` back into the two Rails memo levels
(`Association#@association_scope` + `CollectionProxy#@scope`) is the
fuller convergence and may be what this needs; scope that call as part of
the story.

## Acceptance criteria

- [ ] The `if (this._record.isNewRecord())` non-memoizing branch in
      `CollectionProxy#scope()` is deleted; `scope()` reads as
      `@scope ||= @association.scope`.
- [ ] `HasManyAssociationsTest > update all respects association scope`
      and the `mutation terminals invoked on the proxy itself on stale
new-owner seed` covers stay green.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
