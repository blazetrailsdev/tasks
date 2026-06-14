---
title: "Route non-through self-join collision naming through AliasTracker.aliasedTableFor"
status: claimed
updated: 2026-06-14
rfc: "0027-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-alias-tracking"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-06-14T17:18:33Z"
assignee: "converge-collision-alias-naming"
blocked-by: null
---

## Context

Surfaced by #3238 (converge-alias-tracking). The non-through self-join collision
branch in `JoinDependency.addAssociation` names a colliding target table
`t{tableIndex}` (the `tableAlias`) rather than routing through
`AliasTracker#aliasedTableFor`. Rails names self-join collisions via the
reflection's `alias_candidate` — `{plural_name}_{parent_table}` (and `_N` on
repeat), e.g. `assets_owners` — not `t2`. See `join_dependency.rb:204-206` and
`alias_tracker.rb#aliased_table_for`.

The through path (`_addThroughViaJoinAssociation`) already does this correctly
via `aliasTracker.aliasNameFor(...)`; only the plain `addAssociation` branch
deviates. `join-dependency-quoting.test.ts` ("uses table alias when name
collides") currently pins the `t2` behavior and must be updated to the Rails
alias once the implementation converges (read the corresponding Rails test
first — do not just rename).

This is the last alias-naming branch not flowing through AliasTracker, closing
the gap left open by converge-alias-tracking's acceptance criterion.

## Acceptance criteria

- [ ] Non-through self-join collisions are named via `AliasTracker.aliasedTableFor`/`aliasNameFor` (Rails `alias_candidate` scheme), not `t{tableIndex}`.
- [ ] `t{tableIndex}` alias naming is removed from `addAssociation`; the t-index remains only as the column-alias scheme (`t{i}_r{j}`).
- [ ] `join-dependency-quoting.test.ts` collision expectation updated to the Rails alias; all join/eager-load tests pass.
- [ ] Diff under the 500 LOC ceiling.
