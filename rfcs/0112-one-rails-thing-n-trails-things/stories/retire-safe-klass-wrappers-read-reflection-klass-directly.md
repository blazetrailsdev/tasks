---
title: "Retire the three safeKlass wrappers and read reflection.klass directly"
status: in-progress
updated: 2026-08-20
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6771
claim: "2026-08-20T13:52:33Z"
assignee: "converge-preloader-preloaded-records-onto-load-records"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while consolidating `ThroughAssociation` in PR #6757.

Rails reads `reflection.klass` directly wherever it needs the target class —
`ThroughAssociation#construct_join_attributes` does
`source_reflection.association_primary_key(reflection.klass)`
(`vendor/rails/activerecord/lib/active_record/associations/through_association.rb:59`)
with no guard at all, because in Ruby the reader either resolves the constant or
raises `NameError`, and raising is the intended outcome.

trails' `klass` getter throws for a reflection whose validity has not been
checked yet, so three separate files each carry a private `safeKlass` that
swallows the throw and substitutes `null`:

- `packages/activerecord/src/associations/through-association.ts`
- `packages/activerecord/src/associations/has-many-through-association.ts`
- `packages/activerecord/src/associations/has-one-through-association.ts`

None is a Rails member. Each is file-local, so the consolidation in #6757 could
not remove them: hoisting one to a shared home would have added new non-Rails
cross-file surface to files `parity:api` scores, and deleting them outright
needs the underlying getter fixed first. The reviewer flagged the third copy as
non-blocking style debt; this story is the actual convergence.

Note the swallow is not behaviour-neutral. In `constructJoinAttributes` a null
`reflKlass` makes `compositeConstraints` an empty array, which flips the
`Array(association_primary_key) == composite_query_constraints_list` test to
false and silently routes the join into the FK-value arm instead of the
association-form arm (`through_association.rb:60-66`) — a wrong answer where
Rails would have raised.

## Converged shape

Make `reflection.klass` safe to read at these call sites the way Ruby's is —
either by running `checkValidityBang` at the Rails site that triggers
resolution, or by having the getter resolve without throwing for a
not-yet-checked reflection — then read `reflection.klass` directly in all three
files and delete every `safeKlass`.

Related, do not duplicate: `check-validity-is-a-bang-method` and
`check-validity-in-association-initialize` (0023) cover when validity is
checked; this story covers the swallow-wrappers that exist because it is not.

## Acceptance criteria

1. No `safeKlass` (or equivalent throw-swallowing `klass` wrapper) remains in
   the three association files.
2. `constructJoinAttributes` reads `reflection.klass` directly, matching
   `through_association.rb:59`.
3. An unresolvable through/source klass raises rather than silently selecting
   the FK-value arm.
4. `pnpm parity:api:extra --package activerecord` does not grow;
   `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
5. `pnpm vitest run packages/activerecord/src/associations/` passes.
