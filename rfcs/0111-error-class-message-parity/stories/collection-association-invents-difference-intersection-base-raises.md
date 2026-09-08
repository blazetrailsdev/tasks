---
title: "CollectionAssociation invents difference/intersection base stubs that raise a bare Error"
status: draft
updated: 2026-09-08
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the six `NotImplementedError` rows in PR #7606.
`CollectionAssociation#deleteRecords` was one of them
(`collection_association.rb:415`); these two neighbours in the same file are
not, because Rails has no base declaration for them at all.

`packages/activerecord/src/associations/collection-association.ts:226-233`:

```ts
protected difference(_a: Base[], _b: Base[]): Base[] {
  throw new Error("difference is implemented by CollectionAssociation subclasses");
}

protected intersection(_a: Base[], _b: Base[]): Base[] {
  throw new Error("intersection is implemented by CollectionAssociation subclasses");
}
```

Rails declares `difference` / `intersection` **only** on the two subclasses
that implement them —
`vendor/rails/activerecord/lib/active_record/associations/has_many_association.rb:158,162`
and
`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:177,183`.
`collection_association.rb` has neither, so the base declarations are invented
surface whose only body is an invented raise with an invented message. Rails
does not raise here because there is nothing to raise from.

Contrast `delete_records`, which Rails DOES declare on the base with
`raise NotImplementedError` (`collection_association.rb:414-416`) — that one is
a real Rails strategy hook and stays.

## Converged shape

Delete both base declarations. The two subclasses already define the methods;
if TypeScript needs the base to know the members exist for a `this.difference(...)`
call site, declare them abstract rather than giving them an inventing body — but
check first whether any call site in the base actually needs it, since Rails'
base never calls them.

## Acceptance criteria

- [ ] No `difference` / `intersection` declaration remains on
      `CollectionAssociation` with a body Rails does not have.
- [ ] `HasManyAssociation` and `HasManyThroughAssociation` still define theirs,
      matching the Rails lines above.
- [ ] `pnpm parity:api:extra:gate` is green and `activerecord`'s marks do not
      grow; `pnpm typecheck` clean.
- [ ] The association suites stay green on all lanes.
