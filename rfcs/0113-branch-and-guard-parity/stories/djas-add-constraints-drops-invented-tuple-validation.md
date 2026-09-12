---
title: "Drop DisableJoinsAssociationScope's invented composite-tuple validation for Rails' bare where(key => join_ids)"
status: draft
updated: 2026-09-12
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DisableJoinsAssociationScope.addConstraints`
(`packages/activerecord/src/associations/disable-joins-association-scope.ts:136-150`)
validates the composite `joinIds` before building the predicate, raising two
errors Rails has no counterpart for: `DisableJoinsAssociationScope: composite
joinIds[i] must be an array (got <type>)` and `DisableJoinsAssociationScope:
composite joinIds[i] arity N does not match key columns [...] (arity M)`.

Rails' body is one line with no validation at all —
`scope = reflection.build_scope(reflection.aliased_table).where(key => join_ids)`
(`activerecord/lib/active_record/associations/disable_joins_association_scope.rb:33-35`).
A malformed tuple there is caught downstream by the predicate builder, which
raises Rails' own message, `Expected corresponding value for #{key} to be an
Array` (`activerecord/lib/active_record/relation/predicate_builder.rb:95`).

Surfaced in trails#7721, which removed the invented `where(cols, tuples)`
overload and moved this call onto Rails' array-keyed hash
(`where(new Map([[keyCols, tuples]]))`). With that in place the guards are pure
pre-emption of an error Rails already raises, with a different message and a
different class origin, so a caller matching on Rails' message never sees it.

## Converged shape

Delete both guards and the `arity` / `tuples` locals they need, leaving the
composite arm as `where(key => joinIds)` — which is what it already builds. A
malformed tuple then raises `Expected corresponding value for ... to be an
Array` from `expandFromHash`, as it does in Rails.

Note the single-key arm at `:131-134` also spells Rails' `where(key => join_ids)`
as an object literal; Rails does not branch on key arity here at all, so folding
the two arms into one is part of the same convergence.

## Acceptance criteria

- `disable-joins-association-scope.ts` carries no `DisableJoinsAssociationScope:`
  error string, and no composite arity/array pre-validation.
- `addConstraints` builds its predicate through one `where(key => joinIds)` call
  for both the single and composite key cases.
- A malformed composite tuple raises Rails' `Expected corresponding value for
... to be an Array`, pinned by a test.
- `pnpm parity:api:calls` and `:calls:args` gain no rows.
