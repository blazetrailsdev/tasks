---
title: "Method-order manifest: map operator methods (e.g. []→get/getAttribute) per class"
status: draft
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #5030 (rails-file-structure-method-order per-class keying).

The method-order manifest builder maps three universal Object predicates that
api-compare SKIPs but classes override with real Rails positions (`nil?`→isNil,
`hash`→hash, `eql?`→isEql via `ORDER_ONLY_CANDIDATES` in
`scripts/build-rails-file-structure-manifest.ts`). Ruby OPERATOR methods have
the same shape — real Rails source position, no `rubyMethodToTs` mapping — but
are deliberately NOT mapped, so they sort after the mapped block instead of
their Rails position.

Concrete: `Arel::Table#[]` (arel/table.rb:82, between `having`:78 and `hash`:88)
ports to `table.ts` `get`, but is unmapped and relegated.

A name-only global map is unsafe: `[]` ports to `get` in
`Arel::Table` / `ActiveModel::Errors` / `LazyAttributeHash` but to
`getAttribute` in `ActiveModel::AttributeSet` (attribute_set.rb:16 →
attribute-set.ts:298), where `get` (attribute-set.ts:63) is a non-Rails
Map-compat invention. Mapping `[]`→`get` globally promotes that invention into
Rails' `[]` slot (this was tried and reverted in #5030). Likewise `==`/`<=>`
vary per class (`equals`/`isEqualTo`/`compare`).

## Acceptance criteria

- [ ] Operator methods (`[]`, `==`, `<=>`, …) that a Rails class defines get
      their Rails source position in the method-order manifest.
- [ ] Disambiguation is per-CLASS, not a global name map — e.g. resolve the
      TS spelling from the actual TS class members, or a keyed
      (fqn, operator)→spelling table, so `Table#[]`→`get` and
      `AttributeSet#[]`→`getAttribute` are both correct and the `AttributeSet`
      `get` invention is NOT pulled into the `[]` slot.
- [ ] `packages/arel/src/table.ts` `get` sorts between `having` and the
      `hash`/`eql` block, matching arel/table.rb:78,82,88.
- [ ] No regression: `attribute-set.ts` `getAttribute`/`get` positions unchanged
      unless made Rails-correct.
