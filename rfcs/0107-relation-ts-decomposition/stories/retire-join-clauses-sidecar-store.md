---
title: "Retire the _joinClauses sidecar and merged-join-alias-tracker.ts — orphaned when #6630 retired only the resolver"
status: in-progress
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 9
pr: 6773
claim: "2026-08-20T14:52:33Z"
assignee: "unify-record-delegate-loader-across-rails-and-js-spellings"
blocked-by: null
closed-reason: null
---

## Context

`_joinClauses` is an **orphaned** invented store: the story that owned it has
already merged, but the store survived.

`retire-relation-values-sidecar-stores` explicitly hands it off —

> (The fourth sidecar, `_joinClauses`, is already covered by
> `retire-relation-parallel-join-resolver` in this RFC — do not duplicate it here.)

— and `retire-relation-parallel-join-resolver` is **`done`, PR #6630**. That PR
retired the parallel join _resolver_ (`_resolveAssociationJoin`,
`_resolveThroughJoin`, `_resolveHabtmJoin`, `_isNamedJoinValue` are all gone
from `packages/activerecord/src` on `origin/main`, as F2 predicted). It did not
retire the _store_ the resolver fed. So nothing in this RFC owns `_joinClauses`
today.

It is still live across seven files on `origin/main`:

- `relation.ts:505` — the field (a 6-key record shape: `type`, `table`, `on`,
  `quoted`, `as`, `assoc`, plus the self-join base-alias candidate)
- `relation.ts:3079` — the `_copyStateFrom` copy
- `relation/query-methods.ts:335` — redeclared on the host interface
- `relation/merger.ts:149-150` — merge concatenates the other side's clauses
- `associations/association-scope.ts:976-994` — reads and copies them
- `relation/merged-join-alias-tracker.ts` — a **whole 50-line trails-only
  module** that exists solely to seed this store's tables into the AliasTracker
- `relation.trails.test.ts:295-371`, `calculations.trails.test.ts:125-126` —
  tests written against the field

The Rails counterpart is stated plainly in that module's own header
(`merged-join-alias-tracker.ts:10-13`):

> a trails-only step: Rails has no `_joinClauses` (its raw join clauses ride
> `joins_values` as Arel nodes and are counted by `initial_count_for`)

That is the whole convergence target. Rails keeps raw join clauses in
`joins_values` as Arel nodes; the alias collisions this store is seeded for are
detected naturally because `alias_tracker(leading_joins + join_nodes, aliases)`
(`query_methods.rb:1894`) already sees those nodes. The pre-resolved-table seed
pass is only needed because trails resolves joins into a parallel record shape
that the tracker cannot read.

This is also measurable as private-surface debt the public gates cannot see:
`parity:api:extra` scores `relation.ts` at 2 novel / 3 moved because it does not
score private members at all, and `_joinClauses` is `private`.

## Converged shape

Carry raw join clauses in `joinsValues` as Arel nodes, as Rails does, and let
the shared AliasTracker count them through the normal `build_joins` path.

With that in place:

- `_joinClauses` deletes — field, `_copyStateFrom` copy, host-interface
  redeclaration, the `merger.ts` concatenation and the `association-scope.ts`
  reads.
- `relation/merged-join-alias-tracker.ts` deletes **entirely** — its only
  purpose is seeding this store.
- The `structurallyIncompatibleValuesFor` comparison that
  `retire-relation-values-sidecar-stores` names as "the `_joinClauses` one" goes
  with it, unblocking that story's last acceptance criterion.

The `assoc` key (repeat-association join reuse for `where.associated` /
`where.missing`) and the self-join base-alias candidate are the two behaviours
that must survive the move; both should fall out of the tracker seeing the real
Arel nodes, but they are what the regression tests must pin.

The two trails-only test files assert against the field directly
(`expect((rel as any)._joinClauses...)`). Rewrite them against observable SQL —
emitted aliases — rather than deleting the coverage.

## Acceptance criteria

- [ ] `git grep _joinClauses packages/ scripts/` is empty.
- [ ] `packages/activerecord/src/relation/merged-join-alias-tracker.ts` is
      deleted, along with its import sites.
- [ ] Raw join clauses ride `joinsValues` as Arel nodes and are counted by the
      shared `aliasTracker`, matching `query_methods.rb:1894`.
- [ ] `where.associated` / `where.missing` repeat-association joins still reuse
      one alias, and self-join aliasing is unchanged — pinned by tests asserting
      emitted SQL, not the removed field.
- [ ] `relation.trails.test.ts:295-371` and `calculations.trails.test.ts:125-126`
      are rewritten against SQL, not deleted.
- [ ] `retire-relation-values-sidecar-stores`' `structurallyIncompatibleValuesFor`
      criterion is satisfied for the `_joinClauses` arm.
- [ ] `pnpm parity:api:calls` / `:args` ratchets OK; `parity:api` still reports
      `relation.rb → relation.ts` at 401/401; `parity:test` delta non-negative.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
