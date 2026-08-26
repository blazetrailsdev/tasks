---
title: "Arel.arel_node? is missing; its three arms are inlined as a bare instanceof Node"
status: draft
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel.arel_node?` is a real Rails predicate:

```ruby
# vendor/rails/activerecord/lib/arel.rb:64-66
def self.arel_node?(value) # :nodoc:
  value.is_a?(Arel::Nodes::Node) || value.is_a?(Arel::Attribute) || value.is_a?(Arel::Nodes::SqlLiteral)
end
```

It guards three `#+` bodies — `sql_literal.rb:26`, `fragments.rb:23`, and
`bound_sql_literal.rb` — each spelled `raise ArgumentError, "Expected Arel node"
unless Arel.arel_node?(other)`.

trails has no `arelNode` function at all. PR #7079 added the two missing guards
and inlined the predicate as a bare `other instanceof Node` at all three sites:

- `packages/arel/src/nodes/sql-literal.ts` `plus()`
- `packages/arel/src/nodes/fragments.ts` `plus()`
- `packages/arel/src/nodes/bound-sql-literal.ts` `plus()` (pre-existing)

Two divergences follow. The missing decomposition is one — Rails extracts the
predicate, so trails should too (CLAUDE.md: "If Rails extracts a private helper,
extract it, with the Rails name"). The other is semantic: Rails' predicate
admits three types because in Ruby `Arel::Attribute` is a Struct and
`SqlLiteral` is a String — NEITHER is an `Arel::Nodes::Node`. In trails both
subclass `Node`, so `instanceof Node` happens to accept them today, but that is
a coincidence of two separate documented deviations rather than the ported
condition.

The error class is a third, smaller gap: Rails raises `ArgumentError`, trails
raises `TypeError`.

## Converged shape

`arelNode(value)` exported from `packages/arel/src/arel.ts` beside `sql` /
`star` / `fetchAttribute` (which already mirror `arel.rb`), spelling the three
arms Rails spells; the three `plus()` bodies call it. Re-check the error class
against `ArgumentError` while in there.

## Acceptance criteria

- [ ] `arelNode` exists in `arel.ts` with all three Rails arms and is called by
      each of the three `plus()` bodies.
- [ ] The raised error matches Rails' `ArgumentError` (or the deviation is cited
      at the call site if TS forces otherwise).
- [ ] `parity:api` arel stays at 100%; `parity:api:extra:gate` does not rise.
