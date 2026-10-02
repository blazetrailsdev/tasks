---
title: "arel-select-manager-union-resolves-through-const-get"
status: ready
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::SelectManager#union` resolves its node class by constant lookup
(`vendor/rails/v8.0.2/activerecord/lib/arel/select_manager.rb:198-207`):

```ruby
def union(operation, other = nil)
  if other
    node_class = Nodes.const_get("Union#{operation.to_s.capitalize}")
  else
    other = operation
    node_class = Nodes::Union
  end

  node_class.new self.ast, other.ast
end
```

trails' port (`packages/arel/src/select-manager.ts`, `union`) looks the class up
in a module-level `UNION_NODE_CLASSES` table Rails does not have, holding only
`UnionAll`, so an unknown operation yields `undefined` and a `TypeError` at
`new` where Rails raises `NameError` from `const_get`. It also reads
`other instanceof SelectManager ? other.ast : other` where Rails calls
`other.ast` unconditionally.

`SelectManager#with` in the same file is the converged shape, ported by
`arel-burn-moved-extra-surface-managers-collectors-namespaces`:
`rbConstGet(Nodes, \`With${capitalized}\`)`over a Symbol spelled`":recursive"`.

## Acceptance criteria

- [ ] `union` resolves the class with `rbConstGet(Nodes, …)` as `select_manager.rb:200`, and `UNION_NODE_CLASSES` is deleted.
- [ ] An unknown operation raises `NameError` (`uninitialized constant Arel::Nodes::Union…`), covered by a test in the `.trails.test.ts` twin.
- [ ] `other.ast` is read unconditionally, or the `instanceof` arm is shown to be needed by a ported Rails test and justified at the call site.
- [ ] `pnpm parity:api:calls` stays green with no new baseline row; a `const_get` row or `@missingRailsCall` this retires is deleted.
