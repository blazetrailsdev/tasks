---
title: "Drop the now-unread belongsTo member from CompositePrimaryKeyMismatchReflection"
status: draft
updated: 2026-09-04
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CompositePrimaryKeyMismatchError#initialize`
(`vendor/rails/activerecord/lib/active_record/associations/errors.rb:190-200`)
reads exactly two things off the reflection:

```ruby
if reflection.has_one? || reflection.collection?
  super("... primary key #{reflection.active_record_primary_key} ...")
else
  super("... primary key #{reflection.association_primary_key} ...")
end
```

It calls `has_one?` and `collection?`, and never `belongs_to?`.

PR #7463 converged `reflectionPrimaryKey`
(`packages/activerecord/src/associations/errors.ts`) onto exactly those two
arms, deleting an invented `primaryKey` field and an invented third dispatch
branch that had read `belongs_to?`. That branch was the only reader of
`belongsTo` on the interface, so:

```ts
export interface CompositePrimaryKeyMismatchReflection {
  ...
  belongsTo?: () => boolean;   // now read by nothing
  ...
}
```

`belongsTo` is now a declared member with no Rails counterpart in this error's
contract and no reader in trails. It survived #7463 only because that story's
own "Converged shape" block spelled the interface with it still present, and
removing it would have been unilateral scope expansion mid-review.

Note `AssociationReflection#belongs_to?` itself is real Rails
(`reflection.rb`) and is called elsewhere, including at the raise site
`reflection.ts`'s `checkValidityBang`. This story is only about the member on
the ERROR's structural interface.

## Converged shape

Delete the member:

```ts
export interface CompositePrimaryKeyMismatchReflection {
  activeRecord?: unknown;
  name?: string;
  foreignKey?: string | string[];
  hasOne?: () => boolean;
  isCollection?: () => boolean;
  activeRecordPrimaryKey?: string | string[];
  associationPrimaryKey?: () => string | string[];
}
```

Nothing passes `belongsTo` at any of the five plain-object raise sites
(`associations/association-scope.ts` x2, `associations/has-many-association.ts`
x3), and `reflection.ts` passes `this` — a class instance, whose extra members
are fine under structural typing. So this should be a pure deletion.

## Acceptance criteria

- `CompositePrimaryKeyMismatchReflection` declares no `belongsTo` member.
- No call site is changed to compensate; `new CompositePrimaryKeyMismatchError(this)`
  in `reflection.ts` still typechecks with no cast.
- Every error message is byte-identical; the associations/reflection/has-many
  suites and `packages/activerecord/src/associations/errors.trails.test.ts`
  stay green.
- `pnpm typecheck` and `pnpm parity:api:calls` clean.
