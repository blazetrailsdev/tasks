---
title: "arel_column opens with an Arel-node early return Rails does not have, and feeds the block a node"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while adding `arel_column`'s missing `Arel.arel_node?` tail arm in
PR #7291, which was scoped to that arm and to `aggregate_column`'s block.

Rails' `arel_column` has no early return for an Arel node. It stringifies
whatever it is given and then dispatches
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1989-2005`):

```ruby
def arel_column(field)
  field = field.name if is_symbol = field.is_a?(Symbol)

  field = model.attribute_aliases[field] || field.to_s
  from = from_clause.name || from_clause.value

  if model.columns_hash.key?(field) && (!from || table_name_matches?(from))
    table[field]
  elsif /\A(?<table>(?:\w+\.)?\w+)\.(?<column>\w+)\z/ =~ field
    arel_column_with_table(table, column)
  elsif block_given?
    yield field
  elsif Arel.arel_node?(field)
    field
  else
    Arel.sql(is_symbol ? model.adapter_class.quote_table_name(field) : field)
  end
end
```

The port opens with an arm Rails does not have
(`packages/activerecord/src/relation/query-methods.ts`, `arelColumn`):

```ts
if (field instanceof Nodes.Node) return fallback ? fallback(field as any) : field;
```

So an Arel node short-circuits the whole `case` in trails, and — worse — it is
handed to the BLOCK, where Rails' `block_given?` arm only ever receives the
stringified `field`. Every caller that passes a block (`order_column`,
`arel_columns`) therefore sees a node argument in trails where Ruby guarantees
a String.

It is quiet today because `field.to_s` on an Arel node in Ruby yields a string
that reaches the `Arel.arel_node?` arm as `false`, making that arm effectively
dead upstream — but the trails early return is reachable and takes a different
branch.

## Converged shape

Delete the early return. Follow Rails: coerce to the string first
(`field.to_s`, already spelled as the `String(field)` fallback below it), then
let the four arms dispatch in Rails' order, with `Arel.arel_node?` sitting
where PR #7291 put it. Audit the two block-passing callers for the argument
type they now receive, which becomes a String exactly as in Ruby.

## Acceptance criteria

- [ ] `arelColumn` has no arm ahead of the `columns_hash` check.
- [ ] A block passed by `orderColumn` / `arelColumns` receives a String, never
      an Arel node.
- [ ] `pnpm parity:api:calls`, `parity:api:calls:args` show no new row.
- [ ] AR suite green on all three lanes.
