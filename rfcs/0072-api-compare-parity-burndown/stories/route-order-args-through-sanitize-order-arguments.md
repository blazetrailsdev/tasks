---
title: "Route order/reorder through sanitizeOrderArguments and checkIfMethodHasArgumentsBang"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5937
claim: "2026-08-04T22:47:02Z"
assignee: "i18n-date-complete-frags-wday-element"
blocked-by: null
closed-reason: null
---

## Context

Found by the `activerecord-unrouted-privates-drop-carried-arguments` sweep
(PR #5419), which fixed the check-constraint cluster and inventoried the rest.
Flagged there as "a real convergence but a much larger one — worth its own
story".

`packages/activerecord/src/relation/query-methods.ts` ports two privates that
**no caller routes through** — both have zero call sites:

- `sanitizeOrderArguments(orderArgs)` (query-methods.ts:2090)
- `checkIfMethodHasArgumentsBang(methodName, args, message?)` (:1796)

Rails runs both from `order` and `reorder` (query_methods.rb:656-662, 752-758):

```ruby
def order(*args)
  check_if_method_has_arguments!(__callee__, args) do
    sanitize_order_arguments(args)
  end
  spawn.order!(*args)
end
```

and `sanitize_order_arguments` maps every arg through
`model.sanitize_sql_for_order` (query_methods.rb:2118-2122).

trails' `orderBang`/`reorderBang` (query-methods.ts:599, :678) instead inline a
restructured validation — `disallowRawSqlBang` per branch, plus a bespoke
bind-array arm (`[Arel.sql("x = ?"), ...binds]`) that Rails has no analogue
for. The ported privates are dead as a result.

## Why this is not a mechanical fix

`orderBang` is a large `while` loop with seven arg-shape branches, each doing
its own validation and its own push onto `_orderClauses`. Routing Rails'
two-call preamble in means reconciling:

- trails' bind-array form, which `flattenedOrderArgs` deliberately does NOT
  flatten (query-methods.ts:1820-1830) — Rails flattens unconditionally.
- `sanitize_sql_for_order`'s array handling vs the inline
  `sanitizeSqlArray` interpolation already done in the bind-array arm.
- Whether `disallowRawSqlBang` stays per-branch or moves to the preamble.

Read the whole of `orderBang`/`reorderBang` before starting; the naive
"call the two privates first" edit will double-validate and break the bind
array form.

## Acceptance criteria

- `order`/`reorder` route through both ported privates, or each is deleted
  with a call-site-level justification if the restructuring is judged correct.
- Tests pinning that the carried args reach the built order clauses, verified
  to FAIL beforehand.
- Existing order/reorder tests stay green — especially the bind-array and
  blank-arg compaction cases.
- Wide-baseline entries that converge are removed; baseline only shrinks.
