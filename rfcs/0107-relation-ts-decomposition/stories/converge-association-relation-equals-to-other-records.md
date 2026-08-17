---
title: "AssociationRelation#== is 'other == records' (association_relation.rb:14)"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6624
claim: "2026-08-17T01:02:54Z"
assignee: "port-hwia-bang-forms-and-to-options"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6617 while converging `Relation#==` (relation.rb:1253-1262) onto Rails'
`case/when`. The subclass override was left alone as out of scope for that story.

Rails' `AssociationRelation#==` is one line (association_relation.rb:14-16):

```ruby
def ==(other)
  other == records
end
```

It re-dispatches to `other`'s own `==`, so the comparison semantics come from whatever
`other` is — an Array compares element-wise, another Relation runs `Relation#==`'s
`case/when` (which for an AssociationRelation re-enters through `self == other.records`).

trails (`packages/activerecord/src/association-relation.ts`, `equals`) instead
hand-rolls the array comparison:

```ts
async equals(other: Relation<T> | T[]): Promise<boolean> {
  const ours = await this.toArray();
  const theirs = Array.isArray(other) ? other : await other;
  if (ours.length !== theirs.length) return false;
  for (let i = 0; i < ours.length; i++) if (!ours[i].equals(theirs[i])) return false;
  return true;
}
```

That is equivalent for the Array and loaded-Relation cases but diverges wherever
`other`'s own `==` would do something else — notably another `Relation`, where Rails
compares `to_sql` (relation.rb:1257-1258) and trails materializes and compares records.

`CollectionProxy#==` (collection_proxy.rb:980-982, `load_target == other`) is the sibling
one-liner and should be checked at the same time.

## Converged shape

`AssociationRelation#equals(other)` is `other == records`: resolve `records`
(`await this.records()`) and dispatch to `other`'s own equality — the Array arm compares
element-wise, an object with an `equals` method is asked. Check `CollectionProxy#equals`
against `load_target == other` in the same pass. Both are ~10 lines.

Note `Relation#equals` already landed converged (relation.rb:1253-1262) in #6617,
including the CollectionProxy/AssociationRelation arm that re-dispatches on `records` —
so the base is in place and this story is only the two subclass one-liners.

## Acceptance criteria

- [ ] `AssociationRelation#equals` is association_relation.rb:14-16 — `other == records`,
      dispatching to `other`, not a hand-rolled element loop.
- [ ] `CollectionProxy#equals` is collection_proxy.rb:980-982 (`load_target == other`),
      or is confirmed already faithful.
- [ ] A test covers `assocRelation.equals(otherRelation)` taking Rails' `to_sql` path
      rather than materializing both sides.
- [ ] `pnpm parity:api:calls` / `:args` clean.
