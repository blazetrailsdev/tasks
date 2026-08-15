---
title: "Remaining _namedInnerJoins readers should read joins_values"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6579
claim: "2026-08-15T21:45:01Z"
assignee: "converge-remaining-named-inner-joins-readers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `select_association_list`'s callers in PR #6576.

That PR moved the named-vs-raw discriminator into `selectAssociationList`
(`query_methods.rb:1810-1823`'s `when Hash, Symbol, Array`), so
`applyJoinDependency`, `_eagerJoinDependencyIsLimitable` and
`buildJoinDependencies` now pass `joinsValues` / `leftOuterJoinsValues`
verbatim, as `finder_methods.rb:462-470` and `query_methods.rb:1735-1744` do.

Four readers of the trails-only `_namedInnerJoins` getter remain in
`packages/activerecord/src/relation.ts`, each standing where Rails reads
`joins_values`:

- `:2537-2538` (the `_joinedAssociationTables`-style dedup set)
- `:2606-2609` (`namedInnerTables` via `_resolveAssocTables`)
- `:3236` (a `length === 0` short-circuit guard)
- `:6366` (a second `length === 0` short-circuit guard)

plus `emitJoinPlan`'s reader in `relation/query-methods.ts:2996-2999`, which
hands `_namedInnerJoins` to `selectInnerNamedJoins` where Rails
(`query_methods.rb:1865-1873`) hands it `joins_values`.

## Converged shape

Each site reads `joinsValues` and lets the callee filter, exactly as the three
converged in #6576 now do — `selectAssociationList` / `selectInnerNamedJoins`
already drop raw SQL strings themselves. The two `length === 0` guards need the
raw-vs-named distinction restated in Rails' own terms (Rails guards on
`named_joins.empty? && stashed_joins.empty?`, query_methods.rb:1893), not on a
trails-only subset getter. Once every reader is converged the `_namedInnerJoins`
getter and its `_isNamedJoinValue` partition can shrink to the single insert-time
discriminator `joins()` needs.

## Acceptance criteria

- [ ] No `_namedInnerJoins` reader stands where Rails reads `joins_values`;
      each cited site passes `joinsValues` (or Rails' own guard expression).
- [ ] `pnpm parity:api:calls` / `:args` non-regressed; SQLite, PG, MySQL green.
