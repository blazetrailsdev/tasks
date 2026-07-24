---
title: "WhereClause #+ #- #| #== are unported"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while auditing Ruby operator methods for `OPERATOR_SPELLING_BY_FQN`
(PR #5247, RFC 0025).

`ActiveRecord::Relation::WhereClause`
(`vendor/rails/activerecord/lib/active_record/relation/where_clause.rb`)
defines four operators:

- `:14` `def +(other)` — returns a new WhereClause with concatenated predicates
- `:18` `def -(other)` — predicate subtraction
- `:22` `def |(other)` — union
- `:75` `def ==(other)` — class + predicate-set equality

`packages/activerecord/src/relation/where-clause.ts` has `merge`, `union`,
`invert`, `except`, `or` — but no member corresponding to `+`, `-`, `|`, or `==`
(`union` at :56 is the port of `union`, not of `|`; confirmed by reading both).

So all four stay unmapped in the method-order manifest, and `WhereClause`
equality/arithmetic is unavailable to callers that Rails would let use it.
Worth checking whether any current trails caller hand-rolls predicate
concatenation or set-equality that these would replace.

## Acceptance criteria

- [ ] Port `+`, `-`, `|`, `==` on `WhereClause` under camelCase spellings
      (suggest `plus` / `minus` / `or`-vs-`pipe` / `equals` — pick per the
      surrounding conventions and justify at the call site if a name collides
      with an existing member such as `or`).
- [ ] Confirm against `vendor/rails/activerecord/test/cases/relation/where_clause_test.rb`
      and port the matching tests with names matching Rails verbatim.
- [ ] Add the `(fqn, operator) → spelling` entries to
      `scripts/api-compare/operator-order-spelling.ts`, cited at both ends;
      manifest build must stay green (it now FAILS on dead entries).
- [ ] Members reordered to Rails source order via the autofix.
