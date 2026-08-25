---
title: "Retire HashWithIndifferentAccess's 9 invented enumerable members"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6576
claim: "2026-08-15T19:45:02Z"
assignee: "select-association-list-takes-joins-values-verbatim"
blocked-by: null
closed-reason: null
---

# Retire HashWithIndifferentAccess's 9 invented enumerable members

## Context

Surfaced in PR #6568. `pnpm parity:api:extra --package activesupport` reports
`hash-with-indifferent-access.ts` at **9 novel** members with no Rails (or Ruby
`Hash`) counterpart, none of them tagged:

    allWith  anyWith  flatMap  flatten  has  maxBy  minBy  noneWith  rassoc

Rails' `HashWithIndifferentAccess < Hash` inherits `Enumerable`, so a Ruby
caller writes `hash.any? { }` / `hash.min_by { }` — there is no `anyWith`,
`allWith`, `noneWith`, `minBy`-with-a-different-arity family in Rails or Ruby.
`has` is the Map-shaped duplicate of the now-ported `key?` (:150-156) and every
caller can use `key()`/`hasKey()`/`include()`/`member()` instead. `flatten`,
`flatMap` and `rassoc` are Ruby core `Hash`/`Enumerable` names whose trails
signatures take `(key, value)` rather than a pair, which is why they score as
novel rather than matched.

## Converged shape

Delete the invented spellings and move callers onto the Rails/Ruby-named
members; where a member is a genuine Ruby core method (`flatten`, `flat_map`,
`rassoc`) converge its block arity to the pair shape so it matches instead.

## Acceptance criteria

- [ ] `parity:api:extra` novel count for `hash-with-indifferent-access.ts`
      drops to 0, or the residue carries `@noRailsEquivalent` with a
      classified (PERMANENT/CONVERGEABLE) reason.
- [ ] No caller left on a deleted spelling; `pnpm typecheck` green.
