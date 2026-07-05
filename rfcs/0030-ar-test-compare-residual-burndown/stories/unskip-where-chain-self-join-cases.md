---
title: "Un-skip the 4 self-join where.associated/missing cases in where-chain.test.ts once RFC 0027 self-join aliasing lands"
status: in-progress
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 3
pr: 4644
claim: "2026-07-05T23:21:57Z"
assignee: "unskip-where-chain-self-join-cases"
blocked-by: null
---

## Context

`relation/where-chain.test.ts` was converged onto the canonical schema in
PR 4172 (story `relation-where-chain`, RFC 0019). Four self-join `children`
cases are `it.skip` because trails' flat string ON-rebind path
(`relation.ts` `_addAssocJoin` / `_rebindTableInNode`) cannot alias a
standalone self-join that `where.associated` / `where.missing` must ADD itself
(no prior inner join), producing an ambiguous `comments.id` for
where.associated and wrong filtering (childless rows kept) for the LEFT-join
variants.

Skipped tests (names verbatim, must stay verbatim):

- `associated with child association`
- `associated with add left joins before`
- `associated with add left outer joins before`
- `missing with child association`

Blocked on the impl convergence in RFC 0027:

- `self-join-alias-rebind-target-only` (identity-based rebind of only the
  target Table instance)
- `converge-where-associated-missing-onto-join-dependency` (route the flat
  path through JoinDependency/AliasTracker)

The non-skipped `associated with add joins before` already passes (a prior
inner `joins("children")` supplies a JoinDependency-aliased self-join), so only
these four need un-skipping.

## Acceptance criteria

- [ ] Once the RFC 0027 self-join alias fix lands, remove `.skip` from the four
      tests above in `packages/activerecord/src/relation/where-chain.test.ts`.
- [ ] All four pass on sqlite/postgres/mysql:8 (deterministic; no flake).
- [ ] Trim the skip-boundary comment block to reflect the converged state.
- [ ] Test names unchanged.
