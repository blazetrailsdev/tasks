---
title: "Converge joins(table, on) trails-only two-string heuristic to Rails type-based dispatch"
status: done
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4325
claim: "2026-06-30T15:38:41Z"
assignee: "converge-joins-table-on-trails-heuristic"
blocked-by: null
---

## Context

`Relation#joins` carries a trails-only two-argument form `joins(table, onClause)`
(`packages/activerecord/src/relation.ts` ~1807, the `args.length === 2 && both
strings && /[\s=]/.test(args[1])` branch that pushes a `{ type: "inner", table,
on }` clause). Rails has no such form: `joins` disambiguates by argument _type_
— `joins(:a, :b)` (symbols → JoinDependency) vs `joins("raw sql")` (strings →
verbatim fragment) (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:868-875`).
trails collapses Ruby symbols to TS strings, so it cannot disambiguate by type
and instead applies a whitespace/`=` heuristic on the second arg.

This heuristic is fragile and already carries a documented LIMITATION in the
code: a space-free, operator-only ON clause (`"a.x<b.y"`) misroutes to the
variadic association path. It also complicated the empty-arg guard work
(PR #4283, story `query-methods-empty-args-guard`): Rails' `flatten!` /
`compact_blank!` had to be applied in the join _body_ AFTER this raw-shape
disambiguation, because flattening a single `joins(["a","b"])` array first would
collapse it to two args and trip the `(table, on)` heuristic.

## Acceptance criteria

- Audit all in-repo call sites of the `joins(table, on)` two-string form.
- Converge to a Rails-faithful surface: either route explicit ON joins through
  Arel join nodes / `joins(Arel...)` (Rails' actual path for raw joins) or a
  clearly-named non-`joins` helper, removing the whitespace/`=` heuristic and its
  misroute limitation from `joins`.
- After convergence, `joins` arg handling can flatten!/compact_blank! uniformly
  (in the guard) without the raw-shape pre-pass, matching Rails.
- No regression in `inner-join-association.test.ts` / `relations.test.ts` joins
  tests; update any converted call sites.

## Out of scope

- The empty-argument guard itself (shipped in PR #4283).
