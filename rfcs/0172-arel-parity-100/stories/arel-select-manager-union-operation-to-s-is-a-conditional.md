---
title: "arel: SelectManager#union spells operation.to_s as a conditional because rbObjAsString keeps a Symbol's colon"
status: closed
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel"]
deps:
  - arel-table-as-is-not-a-symbol-seat
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by arel-select-manager-union-operation-is-not-a-symbol-seat. Operator decision 2026-10-02: union's operation is not a Symbol-discriminating seat (select_manager.rb:198-207 has no Symbol branch), so union(:all, other) ports as union('all', other) and the isSymbol arm goes; the body's converged shape waited on rbObjAsString stripping a Symbol's colon, which is rejected as unsafe"
---

## Context

Found while rebasing trails PR 8378 (`arel-converge-invented-control-flow-arms`). `pnpm parity:api:arms:report --package=arel` lists `select-manager.ts#union` at `+if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/select_manager.rb:198-207`):

```ruby
if other
  node_class = Nodes.const_get("Union#{operation.to_s.capitalize}")
```

`packages/arel/src/select-manager.ts#union` spells `operation.to_s` as a conditional, `isSymbol(operation) ? symbolToS(operation) : rbObjAsString(operation)`, because ruby-compat's `rbObjAsString` keeps a Symbol's leading colon where `Symbol#to_s` (`rb_sym_to_s`, `vendor/ruby/v3.3.11/string.c:11734`) drops it. It is the same gap `arel-table-initialize-as-to-s-through-rb-obj-as-string` records for `Table#initialize`.

## Converged shape

`capitalize(rbObjAsString(operation), [])`, once `rbObjAsString` answers a Symbol's name.

## Acceptance criteria

- [ ] `SelectManager#union` reads `rbObjAsString(operation)` with no `isSymbol` arm.
- [ ] `pnpm parity:api:arms:report --package=arel` no longer lists `select-manager.ts#union`.
