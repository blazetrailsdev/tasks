---
title: "Dedupe order clauses by value equality, not JSON.stringify"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `relation-order-string-arg-stays-bare` (PR #4952).

`dedupeOrderClauses` (`packages/activerecord/src/relation/query-methods.ts`,
used by both `orderBang` and `reorderBang`) dedupes order terms by
`JSON.stringify(clause)`. Rails instead relies on value equality: `order!` does
`self.order_values |= args` (query_methods.rb:663-667) and `reorder!` does
`args.uniq!`, both of which use Ruby `eql?`/`hash`.

`JSON.stringify` is a poor proxy for Arel node equality:

- Two structurally identical Arel nodes built from different objects may
  serialize differently (or to `{}`) depending on which fields are enumerable,
  so genuine duplicates can survive.
- Conversely, nodes that differ only in non-enumerable state can serialize
  identically and be wrongly collapsed.
- It is O(size-of-node) per clause and will throw on a circular AST.

The current behavior is correct for the common cases exercised today (bare
strings, `[col, dir]` tuples, simple Ascending/Descending nodes), which is why
it passes — but it is not the Rails rule.

## Acceptance criteria

- [ ] Order-clause dedup uses a value-equality predicate appropriate to each
      stored form (string, tuple, Arel node) rather than `JSON.stringify`.
- [ ] Arel nodes compare by structural equality (add an `eql`-style helper on
      the node types if one is missing).
- [ ] `order("name", "name")`, repeated `Symbol.for("name")`, and
      `reorder("id desc", "id desc")` still collapse to one term.
- [ ] No circular-structure throw is possible on a nested AST order value.
