---
title: "arel: TreeManager#to_dot reassigns the collector from Dot#accept, with no dot local"
status: ready
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps:
  - arel-dot-accept-requires-collector
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::TreeManager#to_dot` reads the collector back from `accept`
(`vendor/rails/v8.0.2/activerecord/lib/arel/tree_manager.rb:47-51`):

```ruby
def to_dot
  collector = Arel::Collectors::PlainString.new
  collector = Visitors::Dot.new.accept @ast, collector
  collector.value
end
```

trails' port (`packages/arel/src/tree-manager.ts`, `toDot`) binds a `dot` local
Rails does not have, discards `accept`'s return value, and reads `.value` off
the collector it constructed. It gives the same string today only because
`Dot#accept` appends to the collector it was handed.

The converged body needs `Dot#accept` to return its collector typed as the
collector, which is `arel-dot-accept-requires-collector` (that story records
the `TS2416` wall on the override's signature).

## Acceptance criteria

- [ ] `toDot` is `let collector = new PlainString(); collector = new Visitors.Dot().accept(this.ast, collector); return collector.value;`, with no `dot` local, as `tree_manager.rb:47-51`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no new baseline row.
