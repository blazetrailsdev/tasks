---
title: "drop-singular-no-reflection-fallback"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5925
claim: "2026-08-02T21:01:25Z"
assignee: "drop-singular-no-reflection-fallback"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/singular-association.ts` carries a
no-reflection fallback (`_singularKeys` + `_inlineSingularTarget`, ~130 lines)
that rebuilds a WHERE clause from raw `options` when `findTarget` is called for
an association name the model never declared. Rails has no counterpart:
`Association#initialize` is constructed with a validated reflection
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:41-45`)
and `SingularAssociation#find_target` is a receiver method on that instance
(`singular_association.rb:47-55`), so a name with no reflection raises
`AssociationNotFoundError` (`associations.rb:56`) long before any load.

PR #5911 (story `converge-singular-find-target-dispatcher`) collapsed the two
macro arms into one Rails-shaped body and made `_singularMacro` raise
`AssociationNotFoundError` instead of defaulting an unresolvable macro to
`hasOne`. That narrowed the fallback's reachable surface sharply:

- The macro is recoverable without a reflection only from the macro-exclusive
  option spellings (`polymorphic`/`foreignType` → belongs_to, `as`/`through` →
  has_one). The `_associations` raw-definition arm cannot fire on its own,
  because `AssociationBuilder.createReflection`
  (`associations/builder/association.ts:113-159`) pushes the `_associations`
  entry and calls `Reflection.addReflection` in the same statement sequence —
  a declared-but-unreflected association is not constructible through the
  builder.
- Instrumenting the fallback across the association / strict-loading suites
  (93 files, 2184 tests) showed exactly one live entry: `ShardedBlogPost`
  `freshChild` with `as: "parent"`, which lands in the polymorphic `as` branch.
- The has_one composite-FK branch (`Array.isArray(foreignKey)`, roughly
  `singular-association.ts:466-482`) and the trailing scalar has_one branch are
  therefore unreachable, as flagged in review on #5911. The belongs_to half is
  reachable only via `polymorphic`/`foreignType` and is likely dead for the
  same reason.

Removing the fallback was deliberately kept out of #5911 to hold that PR to its
single story (dispatcher collapse) and to avoid pruning shared error-raising
code — `routeThroughCheckValidity` / `CompositePrimaryKeyMismatchError` — under
time pressure.

## Acceptance criteria

- Determine, by instrumentation over the AR suites (not by inspection alone),
  which branches of `_inlineSingularTarget` / `_singularKeys` are reachable
  after #5911.
- Remove every unreachable branch. If the whole fallback proves unreachable,
  remove `_inlineSingularTarget` and `_singularKeys` outright and let
  `findTarget` raise `AssociationNotFoundError` for a name with no reflection,
  exactly as `associations.rb:56` does.
- Any direct-call test site that a removal would break is converted to a
  declared reflection rather than deleted, following the pattern #5911 used for
  `CpkOrder#book` / `CpkOrderWithPrimaryKeyAssociatedBook#book`.
- `associations/singular-association.ts` stays at 0 novel extra surface, and no
  new entry is added to the wide call-mismatch baseline.
- Association / strict-loading suites pass with no test renames.
