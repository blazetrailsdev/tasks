---
title: "grouping-queries-flat-and-vs-binary-and-reduce"
status: ready
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 56
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# grouping-queries-flat-and-vs-binary-and-reduce

`grouping_queries` per-group AND: trails emits flat `And([...])`, Rails
nests pairwise.

## Context

Surfaced while closing `grouping-queries-nary-or-vs-binary-or` (RFC 0066).
That story's Or premise was stale: vendored Rails 8.0.2
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:158`)
builds `Arel::Nodes::Or.new(queries)` — n-ary, matching trails. But the
per-group AND reduction on the line above (predicate_builder.rb:157) is
`queries.map! { |query| query.reduce(&:and) }`, and `Node#and`
(`vendor/rails/activerecord/lib/arel/nodes/node.rb:135`) is
`Nodes::And.new [self, right]` — so a 3-predicate group becomes the nested
2-child chain `And([And([p1, p2]), p3])`.

trails' `groupingQueries`
(`packages/activerecord/src/relation/predicate-builder.ts:379`) instead
builds one flat `new Nodes.And(inner)` over the whole group (lines 384/390;
same pattern at the association tuple path, line 684, which also carries a
deliberate flat-`Or` comment at line 691 that should be re-checked against
its Rails counterpart while here). SQL output is identical (the And visitor
joins children with `AND`), but the AST shape differs from Rails' nested
chain — same class of divergence RFC 0066 exists to burn down: anything
walking/pattern-matching the AST (visitors, structural assertions,
node-shape checks) sees a different tree.

## Acceptance criteria

- [ ] Converge `groupingQueries`' per-group AND to Rails' pairwise
      `reduce(&:and)` shape (nested 2-child `And` nodes), or ratify the
      flat n-ary `And` as an intentional deviation with a call-site
      justification per repo policy (deviations should converge — prefer
      converging).
- [ ] SQL output unchanged; `groupingQueries` callers (hash expansion,
      association, composed_of aggregate multi-mapping) stay green.
- [ ] Audit the tuple path at predicate-builder.ts:684–691 (flat
      `And`/`Or` with an O(1)-depth justification comment) against its
      Rails counterpart and align or justify at the call site.
