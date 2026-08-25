---
title: "reverse-single-term-balanced-paren-order"
status: done
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: 3535
claim: "2026-06-17T12:46:24Z"
assignee: "reverse-single-term-balanced-paren-order"
blocked-by: null
---

## Context

Surfaced during review of RFC 0030 story b2-reverse-multicolumn-string-order
(PR #3417). The single-term (no-comma) string branch of `reverseOrderBang` in
`packages/activerecord/src/relation/query-methods.ts` (~line 1345) throws
`IrreversibleOrderError` on ANY `(`/`)` or `CASE` in the clause:

```ts
if (/[(),]/.test(clause) || /\bCASE\b/i.test(clause)) {
  throw new IrreversibleOrderError(...);
}
```

This is stricter than Rails. Rails `does_not_support_reverse?`
(activerecord/lib/active_record/relation/query_methods.rb:1377) only flags a
string order as irreversible when a comma-section has UNBALANCED parens, or it
matches `nulls (first|last)`. A bare balanced-paren single-term order like
`"LENGTH(title)"` or `"LOWER(title) ASC"` is reversible in Rails (flips to
`... DESC`), but trails raises.

`reverseSqlOrder` (query-methods.ts) already has the faithful port
(`isDoesNotSupportReverse`); the multi-column branch was converged to it in
PR #3417. The single-term branch was left untouched (out of scope) and is
guarded by the trails test "reverse order raises on complex expressions"
(relation.test.ts:1477, `Post.order("LOWER(title) ASC").reverseOrder()` expects
throw) — which itself asserts non-Rails behavior and must be reconciled against
the corresponding Rails test before converging.

## Acceptance criteria

- [ ] Single-term string `reverseOrder()` reverses balanced-paren expressions
      (e.g. `"LOWER(title) ASC"` -> `"LOWER(title) DESC"`) instead of raising,
      matching Rails `reverse_sql_order` / `does_not_support_reverse?`.
- [ ] Reconcile the "reverse order raises on complex expressions" test
      (relation.test.ts) against the matching Rails test; converge to Rails
      (do not ratify the deviation).
- [ ] Unbalanced-paren and `nulls first|last` single-term orders still raise
      IrreversibleOrderError.
