---
title: "Drop the invented primaryKey field from CompositePrimaryKeyMismatchReflection and the two casts it forced"
status: draft
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
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

It never reads `primary_key`. trails'
`CompositePrimaryKeyMismatchReflection`
(`packages/activerecord/src/associations/errors.ts:275-285`) nevertheless
declares an invented `primaryKey?: string | string[]` field, and
`reflectionPrimaryKey` (`errors.ts:292-306`) grew an invented third branch
that dispatches on whether `hasOne`/`isCollection`/`belongsTo` are functions
before falling back to it.

That invented field became load-bearing in the wrong way when #7441 renamed
`AbstractReflection#primaryKeyForModel` to `primaryKey`
(`reflection.rb:356`, `def primary_key(klass)`, private). A TS class with a
`protected primaryKey(klass)` method is not structurally assignable to an
interface declaring a public `primaryKey` property — the conflict is
`protected` vs `public`, so no widening of the field's type resolves it. #7441
routed around this with two `as unknown as CompositePrimaryKeyMismatchReflection`
casts at `reflection.ts:934,938`.

## Converged shape

Delete the invented field and the invented dispatch branch, so the helper is
Rails' two arms and nothing else:

```ts
export interface CompositePrimaryKeyMismatchReflection {
  activeRecord?: unknown;
  name?: string;
  foreignKey?: string | string[];
  hasOne?: () => boolean;
  isCollection?: () => boolean;
  belongsTo?: () => boolean;
  activeRecordPrimaryKey?: string | string[];
  associationPrimaryKey?: () => string | string[];
}

function reflectionPrimaryKey(
  reflection: CompositePrimaryKeyMismatchReflection,
): string | string[] | undefined {
  if (reflection.hasOne?.() || reflection.isCollection?.()) {
    return reflection.activeRecordPrimaryKey;
  }
  return reflection.associationPrimaryKey?.();
}
```

The five plain-object raise sites that passed the invented field are all
collection/join arms, and supply the same value through the member Rails
actually reads — `associationPrimaryKey: () => <value>` — at
`associations/association-scope.ts:246,321` and
`associations/has-many-association.ts:472,480,512`. With the field gone, both
casts at `reflection.ts:934,938` delete and `new CompositePrimaryKeyMismatchError(this)`
typechecks directly.

Trap: `has-many-association.ts:526` passes a bare `primaryKey` as a
POSITIONAL argument to `_inlinePolymorphicKeys(ctor, options, primaryKey,
foreignKey)`. It is not an object-literal key and must not be rewritten — a
blind sweep over `primaryKey,` hits it and breaks the parse.

## The invented field is enshrined by a trails-only test

`packages/activerecord/src/associations/errors.trails.test.ts:88-100` asserts
the invented affordance directly:

> `it("CompositePrimaryKeyMismatchError accepts a pre-resolved primaryKey for
reflection-less guards")`

with a literal carrying `primaryKey: ["id"]` and neither predicate. Deleting
the field without converging that test reds it — the message falls through to
the generic `"Association primary key doesn't match with foreign key."`
(verified locally). The test is trails-only, so its name is NOT matched by
`parity:test` and may be rewritten; Rails has no counterpart because Rails
never reads `primary_key` here. Converge it onto
`associationPrimaryKey: () => ["id"]` along with the five raise sites, or
delete it if the reflection-less guard shape goes away entirely.

## Acceptance criteria

- `CompositePrimaryKeyMismatchReflection` declares no `primaryKey` member, and
  `reflectionPrimaryKey` mirrors `errors.rb:192-195` with no extra branch.
- Both `as unknown as CompositePrimaryKeyMismatchReflection` casts in
  `reflection.ts` are deleted, not re-spelled.
- Error messages are unchanged: the same value reaches `formatKey` at every
  one of the five raise sites, and `errors.trails.test.ts` passes with its
  expectations intact (only the literal's member name changes).
- `pnpm typecheck`, the associations/reflection/has-many suites, and
  `pnpm parity:api:calls` stay green.

## Notes

Raised as finding 3 of PR #7441's review; the change above was written and
typechecked locally but the PR merged before it was committed, so main still
carries the field and both casts.
