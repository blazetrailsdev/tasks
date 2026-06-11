---
title: "Set-ops: fold CTE/eager operands into the composed Union* AST (remove the string fallback)"
status: draft
updated: 2026-06-11
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["set-operations-arel-nodes"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-on to `set-operations-arel-nodes`. That story composes set operations as
`Nodes.Union*` and emits via the visitor, but only for operands whose SQL is
fully encoded in the bare manager AST. Operands that use **CTEs**, an
**eager-load join dependency**, or **`annotate()` comments** are still applied in
string space by `_toSqlWithoutSetOp` (CTE prefix, `_buildEagerSql`, comment
append), so they cannot be represented in the composed `Union*` node.

To avoid silently dropping those clauses, `relation.ts` guards the AST path with
`_setOpOperandUsesStringFeatures()` and falls back to `_toSqlSetOperationConcat()`
— the legacy per-side string concatenation, including the operator-string map,
the `(left) OP (right)` vs `left OP right` paren templating, and the PG `$N`
regex renumber. This story removes that fallback by encoding CTE/eager/annotate
on the manager AST (mirroring Rails `build_arel` → `build_with` / CTE node
construction and `apply_join_dependency`) so every set operation composes through
the single visitor pass.

Note: `from()` is already AST-native (applied via `_buildFromNode` + `manager.from`
in `_buildSelectManager`), so it is NOT part of this story. Bind threading for the
**common** composed path is tracked separately by `set-operations-bind-threading`;
this story is the operand-feature parity that makes the string fallback
unnecessary.

## Scope

- Apply CTEs (`_ctes`) to the operand's SelectManager AST via `manager.with` /
  `manager.withRecursive` (build CTE nodes from the stored definitions) instead
  of the `WITH … <sql>` string prefix, so they thread through the composed node.
- Compile eager-load operands through their JoinDependency SelectManager
  (`_buildEagerJoinManager`) at the AST level so the composed node carries the
  join dependency rather than reverting to a plain select.
- Carry `annotate()` comments on the composed node (or document why they remain
  string-appended for the compound statement).
- Delete `_toSqlSetOperationConcat()` and `_setOpOperandUsesStringFeatures()`
  once all operand features compose; route every set operation through
  `_toSqlSetOperationArel()`.

## Rails source

- `build_arel` → `build_with(arel)` (`active_record/relation/query_methods.rb`
  ~L1762, WITH/WITH RECURSIVE construction ~L1913) and `apply_join_dependency`
  when `eager_loading?`.
- arel `nodes/binary.rb` set-op nodes + `visitors/to_sql.rb` `visit_Arel_Nodes_Union*`.

## Acceptance criteria

- [ ] Set operations whose operands use CTEs / eager-load / annotate compose a
      single `Nodes.Union*` AST and emit via the visitor (no string fallback).
- [ ] `_toSqlSetOperationConcat` and `_setOpOperandUsesStringFeatures` are
      removed; the operator-string map and paren templating are gone from
      activerecord entirely.
- [ ] SQLite / PG / MySQL output and bind order unchanged for the same queries;
      CTE/eager/annotate set-op operands produce correct results on all three.
