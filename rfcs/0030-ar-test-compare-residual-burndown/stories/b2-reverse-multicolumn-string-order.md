---
title: "reverseOrder handles multi-column string order"
status: done
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3417
claim: "2026-06-15T23:10:30Z"
assignee: "b2-reverse-multicolumn-string-order"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-default-scoping. Rails `test_order_to_unscope_reordering`
is ported but skipped ("order to unscope reordering") in
`packages/activerecord/src/scoping/default-scoping.test.ts`.

Reversing a multi-column string order ("salary DESC, name ASC") raises
IrreversibleOrderError in `packages/activerecord/src/relation/query-methods.ts`
(the comma/`CASE` guard). Rails' `reverse_order` splits the comma-joined order
and flips each term.

## Acceptance criteria

- [ ] `reverseOrder()` reverses each term of a comma-joined string order without raising.
- [ ] Un-skip "order to unscope reordering" in default-scoping.test.ts; it passes on sqlite.
