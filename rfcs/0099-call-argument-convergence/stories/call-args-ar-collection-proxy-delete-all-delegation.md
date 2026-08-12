---
title: "call-args-ar-collection-proxy-delete-all-delegation"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6387
claim: "2026-08-11T23:34:34Z"
assignee: "call-args-ar-collection-proxy-delete-all-delegation"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-dropped-argument` (RFC 0099). Rails'
`CollectionProxy#delete_all` (`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:474-476`)
is a one-liner:

```ruby
def delete_all(dependent = nil)
  @association.delete_all(dependent).tap { reset_scope }
end
```

trails' `packages/activerecord/src/associations/collection-proxy.ts:3853`
reimplements the whole thing in the proxy: it validates `dependent`, maps
`:destroy`/`:delete`/`"deleteAll"` onto a `delete_all`/`nullify` strategy,
branches on `_isThrough` / `_relationStateDiverged()`, and calls
`_deleteThroughAllSql()` / `_nullifyThroughAll()` / `super.deleteAll()` /
`this.scope().deleteAll()` directly. `CollectionAssociation#deleteAll`
(`associations/collection-association.ts:506`) already exists and is where the
Rails logic belongs (`collection_association.rb:148-165` →
`delete_or_nullify_all_records`).

The RFC 0095 call-argument baseline row
(`associations/collection-proxy.ts` `delete_all` → `delete_all`, Rails
`(ref:dependent)` vs trails `()`) is the surfaced symptom and carries this
story id in its `reason`.

## Acceptance criteria

1. `CollectionProxy#deleteAll` is Rails' one-liner: delegate to the
   association's `deleteAll(dependent)` and `resetScope()`.
2. The strategy dispatch, the through arm and the nullify arm live in
   `CollectionAssociation` / `HasManyThroughAssociation`, mirroring
   `collection_association.rb` and `has_many_through_association.rb`.
3. The `associations/collection-proxy.ts` `delete_all` → `delete_all`
   `kind: "args"` baseline row is deleted (only-shrink; no `--write`).
4. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
