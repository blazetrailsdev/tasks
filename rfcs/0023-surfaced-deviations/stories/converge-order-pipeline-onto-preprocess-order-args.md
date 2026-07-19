---
title: "order!/reorder! normalize via preprocess_order_args; delete _applyOrderToManager re-parsing"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `relation-order-string-arg-stays-bare` (PR #4952).

trails has **two parallel order pipelines**, and the Rails-faithful one is dead
code:

- **Live path:** `Relation#_buildArel`
  (`packages/activerecord/src/relation.ts:4987`) →
  `Relation#_applyOrderToManager` (`relation.ts:5692`), which re-parses
  `_orderClauses` entries (bare strings, `[col, dir]` tuples, Arel nodes) into
  Arel ordering nodes at SQL-build time.
- **Dead path:** `preprocessOrderArgs` / `buildOrder` / `buildOrderNode`
  (`packages/activerecord/src/relation/query-methods.ts:2072`, `:2125`, `:2148`)
  — faithful ports of Rails' `preprocess_order_args` / `build_order`. They are
  reachable only through private delegating shims on `Relation`
  (`relation.ts:7150`, `:7155`) that nothing calls. Verified empirically:
  instrumenting `buildOrder`/`buildOrderNode` produced no output for
  `Customer.order("name ASC").toSql()`.

Rails does the normalization **once, at `order!` time**
(`preprocess_order_args` maps Symbol→`order_column(...).asc`, Hash→directional
nodes, String→unchanged) and stores `order_values` as Arel nodes/strings;
`build_order` then just emits them. trails instead stores a bespoke
`_orderClauses` union (`string | [string, "asc"|"desc"] | Nodes.Node`) and
defers the Symbol/Hash qualification decision to `_applyOrderToManager`.

This duplication is why the string-vs-symbol deviation existed at all, and why
the fix had to be applied in two places (`_applyOrderToManager` for the forward
path and `reverseOrderBang` for the reverse path). It also means
`preprocessOrderArgs`'s `columnReferences` / `validateOrderArgs` work is
reimplemented inline in `orderBang`/`reorderBang`.

Rails ref: `Relation#order!` / `#preprocess_order_args` / `#build_order`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:663`,
`:2081`, and `build_arel`'s `arel.order(*orders)`).

## Acceptance criteria

- [ ] `order!`/`reorder!` normalize args through `preprocessOrderArgs` so
      `_orderClauses` holds what Rails' `order_values` holds (Arel nodes +
      untouched strings), not the bespoke `[col, dir]` tuple form.
- [ ] `_applyOrderToManager`'s re-parsing of strings/tuples is deleted; the
      order emit step becomes `buildOrder`-equivalent (emit stored values).
- [ ] The dead private `preprocessOrderArgs` / `buildOrder` shims on `Relation`
      either become the live path or are removed (do not leave both).
- [ ] String order args stay bare and Symbol/Hash args stay qualified — the
      behavior locked by `order-string-arg-stays-bare.trails.test.ts` is
      unchanged.
- [ ] `reverseOrderBang` reverses stored values without re-qualifying.
- [ ] No regression in the order/finder/relations/calculations suites.
