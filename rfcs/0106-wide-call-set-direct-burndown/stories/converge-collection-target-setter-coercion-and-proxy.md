---
title: "Drop target='s array coercion and proxy materialization"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6683
claim: "2026-08-18T00:44:19Z"
assignee: "converge-collection-target-setter-coercion-and-proxy"
blocked-by: null
closed-reason: null
---

# Drop `target=`'s array coercion and proxy materialization

## Context

`CollectionAssociation#target=`
(`packages/activerecord/src/associations/collection-association.ts`) converged
onto `collection_association.rb:285-296` in PR #6675, but two trails-only steps
remain inside the Rails body:

1. **Array coercion.** Rails' non-inversing arm and its `Array` arm are both a
   bare `super` — `@target = record` (`association.rb:103`), which in Ruby
   stores whatever it is given, including a lone record or `nil`. trails coerces:
   `records == null ? [] : Array.isArray(records) ? records : [records]`. The
   coercion predates the convergence (callers rely on the collection target
   always being an array), but it is not a branch Rails has.

2. **Proxy materialization.** The single-record arm calls
   `associationProxy(this.owner, this.reflection.name)` for effect before
   `replace_on_target`, because the write must land in the shared
   `CollectionProxy` store or later readers (`size()`/`load()`) miss it. Rails
   makes no such call — `replace_on_target` writes `@target` directly
   (`collection_association.rb:296`, `:457-476`). Removing the line without
   fixing the store is a real regression: verified against
   `inverse-associations.test.ts` "with has many inversing does not add
   duplicate associated objects", which reds without it.

Both fall out of the two-seat target store, so this story is downstream of
[[retire-collection-association-write-target-store]].

## Converged shape

- `target=` is Rails' four lines: the `has_many_inversing` guard, then
  `nil` / `Array` / else, with `super` and `replace_on_target` and nothing else.
- No coercion, no proxy materialization inside the writer.

## Acceptance criteria

- [ ] `set target` contains no call Rails' `target=` does not make.
- [ ] `inverse-associations.test.ts` and `replace-on-target-inversing.trails.test.ts`
      stay green.
