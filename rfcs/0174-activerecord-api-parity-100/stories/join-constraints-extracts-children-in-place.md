---
title: "JoinAssociation#join_constraints: extract! the And's children in place; drop nodeReferencesTable and the rebuilt nodes"
status: closed
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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
closed-reason: "landed in trails#8479 (e7d06dcd75): join-association.ts on origin/main 7bcc4d4996 calls extractBang(nodes.children, ...) in place and emits new Nodes.On(nodes) over the same And; nodeReferencesTable and the True/lone-child/And rebuild are gone (git grep nodeReferencesTable: 0 hits). Closed at the sunset triage of 0174-activerecord-api-parity-100."
---

## Context

`JoinAssociation#join_constraints`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency/join_association.rb:57-70`)
splits the first constraint in place:

```ruby
nodes = arel.constraints.first

if nodes.is_a?(Arel::Nodes::And)
  others = nodes.children.extract! do |node|
    !Arel.fetch_attribute(node) { |attr| attr.relation.name == table.name }
  end
end

joins << join_type.new(table, Arel::Nodes::On.new(nodes))
```

`extract!` removes the matching children from `nodes.children` and returns
them, so `nodes` stays the same `And`, now holding the rest.

trails (`packages/activerecord/src/associations/join-dependency/join-association.ts`,
around line 104) does something else:

- It partitions into `others` and a new `remaining` array, then rebuilds
  `nodes`: `new Nodes.True()` when `remaining` is empty, the lone child when it
  has one, `new Nodes.And(remaining)` otherwise. Rails has none of those three
  arms. It emits `ON` over the same `And`, even an empty one.
- The block is an invented module function, `nodeReferencesTable`, which
  compares `String(rel.tableAlias ?? rel.name)` against
  `String(table.tableAlias ?? table.name)`, guards on
  `attr instanceof Arel.Attribute`, and tracks a `found` flag. Rails compares
  `attr.relation.name == table.name` and returns the block's value.
- `others` is always an array; Rails leaves it `nil` when `nodes` is not an
  `And`, and guards with `others && !others.empty?`.

`Nary#children` is `readonly` in `packages/arel/src/nodes/nary.ts`; Rails'
`attr_reader :children` returns the live array, and `extract!` mutates it. The
array itself is mutable in trails too, so the readonly field does not block
this. `extract!` is ActiveSupport's `Array#extract!`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/array/extract.rb`).

The sibling `converge-append-constraints-to-in-place-mutation` covers
`append_constraints` in the same method; this story is the `extract!` half.

## Acceptance criteria

- [ ] `others` comes from ActiveSupport's `extract!` analogue on
      `nodes.children`, with the block
      `!fetchAttribute(node, (attr) => attr.relation.name === table.name)`.
- [ ] `nodes` is not rebuilt: no `True`, no unwrap of a single child, no new
      `And`. `nodeReferencesTable` and `remaining` are deleted.
- [ ] `others` is unset when `nodes` is not an `And`, and the later guard is
      Rails' `others && !others.empty?`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new
      baseline row. Any SQL that changes (an `ON` over an emptied `And`) is
      checked against Rails' output for the same association, not papered over.
