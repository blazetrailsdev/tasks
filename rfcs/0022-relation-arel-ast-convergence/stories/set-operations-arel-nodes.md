---
title: "Compose union/unionAll/intersect/except as Arel Union* nodes (drop string concat)"
status: ready
updated: 2026-06-11
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: []
deps-rfc: []
est-loc: 400
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Cluster 2 of the RFC. `relation.ts` `_toSql` (~L3830–3858) builds set operations
by compiling each side independently and **string-concatenating** them: it picks
an operator from `{ union: "UNION", unionAll: "UNION ALL", intersect:
"INTERSECT", except: "EXCEPT" }` and string-templates the cross-adapter paren
difference (`sqlite` → `left OP right`; PG/MySQL → `(left) OP (right)`). The
spawn methods `union`/`unionAll`/`intersect`/`except` (relation.ts L1292–1328)
only stash `{ type, other }` in `_setOperation`.

Rails composes the corresponding `Arel::Nodes::Union`/`UnionAll`/`Intersect`/
`Except` (`vendor/rails/.../arel/lib/arel/nodes/binary.rb`) and lets the visitor
emit SQL. trails already has those nodes and managers:

- `Nodes.Union`/`UnionAll`/`Intersect`/`Except`
  (`packages/arel/src/nodes/binary.ts` L214/223/232/259; exported `nodes/index.ts`
  L57–60).
- `SelectManager#union`/`#unionAll`/`#intersect`/`#except`/`#minus`
  (`packages/arel/src/select-manager.ts` L359/502/367/375/508).
- Visitors `visitArelNodesUnion`/`UnionAll`/`Intersect`/`Except`
  (`packages/arel/src/visitors/to-sql.ts` L517–536) and the SQLite
  `infixValueWithParen` override that strips parens for compound-SELECT operands
  (`packages/arel/src/visitors/sqlite.ts` L89).

## Scope

- Replace the `_toSql` `_setOperation` string branch with arel composition: build
  each side's `SelectManager`/`SelectStatement` and call
  `manager.union(other)`/`.unionAll(other)`/`.intersect(other)`/`.except(other)`
  to get the `Nodes.Union*` node, then run it through the visitor for the SQL.
- Delete the operator-string table and the `(left) OP (right)` vs `left OP right`
  paren templating — the visitor + SQLite override own paren placement.
- **Bind threading is deferred** to `set-operations-bind-threading`. This story
  may keep the existing bind concatenation as an interim step **iff** it does not
  regress; prefer composing the node and emitting SQL on SQLite first (no `$N`
  renumbering needed there), and gate the PG/MySQL bind path behind the follow-on
  if a clean split is possible. If binds cannot be split cleanly, fold both into
  one PR but keep ≤ 500 LOC.
- Preserve `allowRetry = false` for set operations (relation.ts L2280).

## Rails source

- arel `nodes/binary.rb` set-operation nodes (`Union`, `UnionAll`, `Intersect`,
  `Except`).
- `SelectManager` `union`/`intersect`/`except`/`minus`.

## Test assertions

- `vendor/rails/activerecord/test/cases/relation_test.rb` and the relation
  union/except cases; trails mirrors under
  `packages/activerecord/src/relation/` exercising `union`/`unionAll`/`intersect`/
  `except` (SQLite no-paren vs PG/MySQL parenthesized compound SELECT).

## Acceptance criteria

- [ ] `_toSql` composes `Nodes.Union*` via `SelectManager` and emits via the
      visitor; the operator-string map and paren string-templating are gone.
- [ ] SQLite emits an unparenthesized compound SELECT; PG/MySQL emit
      `(left) OP (right)` — both via the visitor, not string templates.
- [ ] Existing set-op tests pass on SQLite; PG/MySQL behavior unchanged (binds
      may still route the old way pending the follow-on). No test renames.

## Notes

- The cross-adapter paren difference is already encoded in the arel visitors; do
  not reintroduce it in activerecord.
