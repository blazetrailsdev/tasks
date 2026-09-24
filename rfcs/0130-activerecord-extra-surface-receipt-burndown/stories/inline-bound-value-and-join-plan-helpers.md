---
title: "Inline normalizeBoundValue and emitJoinPlan into their Rails callers"
status: ready
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `inline-ruby-bodies-extracted-as-named-helpers-remainder` for the
LOC ceiling. Two `@noRailsEquivalent CONVERGEABLE` helpers remain in
`packages/activerecord/src/relation/query-methods.ts`:

- `normalizeBoundValue` — Rails writes this block inline, twice, in
  `build_named_bound_sql_literal` and `build_bound_sql_literal`
  (`activerecord/lib/active_record/relation/query_methods.rb:1682-1720`), the
  named one through `values.transform_values` (ruby-compat `transformValues`).
- `emitJoinPlan` (+ the `JoinEmissionPlan` interface) — Rails' `build_joins`
  (`query_methods.rb`, `def build_joins(join_sources, aliases = nil)`) does it
  inline: `leading_joins`, then `alias_tracker(leading_joins + join_nodes,
aliases)` + `construct_join_dependency(named_joins, join_type)
.join_constraints(stashed_joins, alias_tracker, references_values)` under
  `unless named_joins.empty? && stashed_joins.empty?`, then `join_nodes`.
  The trails-only alias merge-back loop is a no-op: `Relation#aliasTracker`
  hands `aliases.aliases` to `AliasTracker.create`, which shares that same
  `AliasCounts` object.

A worked version of both (tests green on relation/ + join suites, ~130 LOC)
was written on the branch of the PR that closes the parent story and backed
out for size.

## Acceptance criteria

- `normalizeBoundValue`, `emitJoinPlan` and `JoinEmissionPlan` are gone; both
  bound-literal builders and `buildJoins` carry the Rails bodies.
- Their receipts are deleted; `pnpm parity:api:extra:gate` stays green.
