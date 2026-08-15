---
title: "apply_join_dependency's limitability guard is still extracted into two trails-only privates"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6575
claim: "2026-08-15T19:15:06Z"
assignee: "apply-join-dependency-limitability-guard-extracted-twice"
blocked-by: null
closed-reason: null
---

# `apply_join_dependency`'s limitability guard is still extracted into two trails-only privates

## Context

Surfaced converging `apply_join_dependency` in PR #6573, which inlined
`except(...).joins!` and `select_association_list` but left the surrounding
guard extracted.

`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:463-470`
spells the whole limitability test inline inside `apply_join_dependency`, with
`using_limitable_reflections?` (finder_methods.rb:487) as the only helper.

`packages/activerecord/src/relation.ts` additionally carries:

- `_eagerJoinDependencyIsLimitable(jd)` — the same two-clause guard, duplicated
  from the inline copy in `applyJoinDependency`;
- `_applyJoinDependencyIsLimitable(eagerSpecs)` — a spec-taking wrapper around it;
- `_withEagerJoinDependency(jd)` — the `joins!(join_dependency)` spawn, still
  read by `_buildEagerIdSubquery`.

None has a Rails counterpart. They exist because trails has extra
apply-join-dependency entry points (`_applyJoinDependencyAsync`,
`_applyEagerJoinDependency`, `_executeEagerLoad`, `_isDeferredDistinctPkSubquery`)
that Rails reaches through one block-form method.

## Converged shape

Collapse the extra entry points onto the single Rails method where possible —
Rails' `apply_join_dependency { |relation, jd| ... }` block form is the shape
the async/eager callers want — so the guard has one home and the three privates
above disappear. Where a caller genuinely cannot be folded in, it should call
`applyJoinDependency` rather than re-spell its guard.

Related: the sync/async split is itself tracked by
`converge-relation-subquery-distinct-pk-materialization`; this story is the
surface reduction, not the materialization work.

## Acceptance criteria

- [ ] `_eagerJoinDependencyIsLimitable`, `_applyJoinDependencyIsLimitable` and
      `_withEagerJoinDependency` are gone, or reduced to one Rails-named method.
- [ ] The two-clause `using_limitable_reflections?` guard appears once.
- [ ] `pnpm parity:api:extra --package activerecord` shrinks; three adapters green.
