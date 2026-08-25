---
title: "createStringJoin wraps its argument where Rails passes it through"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6708
claim: "2026-08-18T18:14:58Z"
assignee: "port-test-date-strftime-different-format"
blocked-by: null
closed-reason: null
---

## Context

`FactoryMethods#createStringJoin` in
`packages/arel/src/factory-methods.ts:74-77` converts its argument before
delegating:

```ts
createStringJoin(to: string | Node): StringJoin {
  const node = typeof to === "string" ? new SqlLiteral(to) : to;
  return this.createJoin(node, null, StringJoin) as StringJoin;
}
```

Rails passes `to` straight through
(`vendor/rails/activerecord/lib/arel/factory_methods.rb:23-25`):

```ruby
def create_string_join(to)
  create_join to, nil, Nodes::StringJoin
end
```

`Nodes::StringJoin` (`arel/nodes/string_join.rb:5-9`) is a bare
`Join` subclass that stores `left` as given, so in Rails the raw String reaches
the node and the visitor renders it. trails wraps it in a `SqlLiteral` at the
call site instead — an a3 (conversion moved to the caller), and the reason the
call-argument gate records `ref:node` against Ruby's `ref:to`.

Two things to establish while converging: whether trails' `StringJoin` visitor
actually requires a `Node` (in which case the conversion belongs inside the node
or the visitor, not the factory), and whether the widened `string | Node`
parameter is needed at all — Rails' signature is a single `to`.

Surfaced in RFC 0096 wave 3 (PR #6513), where it was left standing rather than
renamed away because a rename cannot close it.

## Converged shape

`createStringJoin(to)` delegating to `createJoin(to, null, StringJoin)` with no
local and no call-site conversion, matching factory_methods.rb:23-25.

## Acceptance criteria

- [ ] `createStringJoin` passes `to` through unconverted.
- [ ] Any `SqlLiteral` wrapping that is genuinely required moves to wherever
      Rails does it (node or visitor), justified against the Rails line.
- [ ] The `factory-methods.ts` `naming` call-argument row is retired, with no
      new `shape` row.
- [ ] Arel to_sql tests covering a string join still pass on all three adapters.
