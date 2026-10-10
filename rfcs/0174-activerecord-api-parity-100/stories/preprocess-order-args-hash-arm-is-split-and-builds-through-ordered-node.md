---
title: "activerecord: preprocess_order_args' Hash arm is split in two and builds orderings through orderedNode"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8415, which converged the arel-node key test of this arm
(`when Arel::Nodes::SqlLiteral, Arel::Nodes::Node, Arel::Attribute`) and left the arm's shape.

`QueryMethods#preprocess_order_args`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:2092-2112`) has one
`when Hash` arm:

```ruby
when Hash
  arg.map do |key, value|
    if value.is_a?(Hash)
      value.map do |field, dir|
        order_column([key.to_s, field.to_s].join(".")).public_send(dir.downcase)
      end
    else
      case key
      when Arel::Nodes::SqlLiteral, Arel::Nodes::Node, Arel::Attribute
        key.public_send(value.downcase)
      else
        order_column(key.to_s).public_send(value.downcase)
      end
    end
  end
```

`preprocessOrderArgs` (`packages/activerecord/src/relation/query-methods.ts`) splits it in two: a
`Map` arm that tests the key class but has no `value.is_a?(Hash)` branch, and a plain-object arm that
has the nested-Hash branch but no key-class test. Both build the ordering through a file-local
`orderedNode(node, dir)` helper (`new Nodes.Descending` / `new Nodes.Ascending`) where Rails sends
`public_send(dir.downcase)` to the column, so an invalid direction that `validate_order_args` let
through becomes `ASC` instead of a `NoMethodError`, and `asc` / `desc` are never calls.

## Converged shape

One Hash arm over both the `Map` and plain-object seats, with Rails' two branches in Rails' order, and
`rbFPublicSend(column, downcase(dir))` in place of `orderedNode`, which is deleted.

## Acceptance criteria

- [ ] `preprocessOrderArgs` has one Hash arm whose body mirrors `query_methods.rb:2095-2109` branch for branch.
- [ ] `orderedNode` is deleted; the direction is a `public_send`.
- [ ] `relation/order.test.ts` and `relations.test.ts` stay green on SQLite, PostgreSQL and MySQL; `pnpm parity:api:calls` and `:args` green.
