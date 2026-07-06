---
title: "Mirror Rails joins_values.empty? short-circuit on live _applyJoinsToManager path"
status: claimed
updated: 2026-07-06
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-06T00:01:56Z"
assignee: "applyjoins-live-path-empty-joins-shortcircuit"
blocked-by: null
closed-reason: null
---

## Context

`Relation#_applyJoinsToManager` (`packages/activerecord/src/relation.ts:3588-3634`)
does NOT implement Rails' `if joins_values.empty?` short-circuit
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1838-1842`),
unlike the sibling `buildJoinBuckets`
(`packages/activerecord/src/relation/query-methods.ts:2777-2793`), which routes
pure-left-outer associations into the `named_join` bucket and returns early with
`OuterJoin` type.

On the live path, pure left-outer associations (no inner/eager joins) always go
through `constructJoinDependency` + stashed-JD fold instead. For the pure-CTE
case this happens to emit identical SQL (an empty named JD's stash still yields
the same join_constraints), but the shape divergence is latent: a future
pure-left-outer scenario in the same shape could misbehave.

## Acceptance criteria

- `_applyJoinsToManager` mirrors Rails' `if joins_values.empty?` short-circuit
  (query_methods.rb:1838-1842) for the pure-left-outer case, matching
  `buildJoinBuckets`' `named_join`/early-return branch.
- Add coverage asserting the pure-left-outer-association live path emits the same
  SQL as the subquery `from(relation)` path.

## Out of scope

- CTE-symbol routing (done in PR #4635).
