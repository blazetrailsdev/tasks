---
title: "emit-time-joined-tables-chain-tail-memoization"
status: in-progress
updated: 2026-06-25
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4092
claim: "2026-06-25T01:02:34Z"
assignee: "emit-time-joined-tables-chain-tail-memoization"
blocked-by: null
---

## Context

Reviewer-flagged pre-existing fidelity gap surfaced during PR #4007
(fully-defer-construction-aliasing-via-emit-on-rebuild). Rails'
`JoinDependency#make_constraints` memoizes `[table, terminated]` keyed by the
remaining reflection chain in `@joined_tables` (join_dependency.rb:193-200) for
the OuterJoin case, so a chain tail shared across nested includes / two through
paths reuses ONE alias instead of re-aliasing.

trails does NOT memoize this: `_resolveThroughGroup` and `_rebuildChildJoin`
(packages/activerecord/src/associations/join-dependency.ts) each re-resolve via
`aliasNameForTable`. trails currently covers the common cases differently —
shared include-prefixes collapse to one tree node via `_addOrReuse` /
`_findNodeByPath`, and within-chain tails are shared by the through-group — so
the cascaded-eager + nested-through suites match Rails today. The uncovered case
is two DISTINCT through associations sharing a chain-tail reflection, where Rails
reuses the alias but trails would mint an extra `{candidate}_join` alias.

Now that ALL aliasing is emit-time (PR #4007), the resolver is the natural home
for this memoization.

## Acceptance criteria

- [ ] Emit-time alias resolution memoizes `[table, terminated]` by the remaining
      reflection chain (Rails `@joined_tables`, join_dependency.rb:193-200), so a
      chain tail shared across two through/include paths reuses one alias.
- [ ] Add a test reproducing two distinct through associations that share a
      chain-tail reflection; assert the shared tail emits a single alias matching
      Rails' output (no spurious extra `_join` alias).
- [ ] Existing cascaded-eager / nested-through / join-dependency suites stay
      green; test:compare and api:compare non-negative.
