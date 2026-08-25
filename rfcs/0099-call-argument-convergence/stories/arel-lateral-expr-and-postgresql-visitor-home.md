---
title: "Lateral reads Unary#expr and lives on the PostgreSQL visitor"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6361
claim: "2026-08-11T14:16:14Z"
assignee: "arel-nodes-manager-residual-classification"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while completing `converge-arel-visitor-helper-collector-parameter-position`
(PR #6355), which dropped the explicit `always_wrap_selects` default at this
call site. The argument that remains does not match Rails.

**Rails** (`activerecord/lib/arel/visitors/postgresql.rb:64-67`):

```ruby
def visit_Arel_Nodes_Lateral(o, collector)
  collector << "LATERAL "
  grouping_parentheses o.expr, collector
end
```

**trails** (`packages/arel/src/visitors/to-sql.ts`, `visitArelNodesLateral`):

```ts
collector.append("LATERAL ");
return this.groupingParentheses(node.subquery, collector);
```

Two deviations in one method:

1. The field is `subquery`, where Rails reads `o.expr` — `Nodes::Lateral < Unary`
   (`arel/lib/arel/nodes/unary.rb`), so `expr` is the inherited `Unary` reader.
   This is the same class of divergence as the already-filed
   `arel-unary-operation-expr-rename` (RFC 0099); converge it the same way.
2. The visitor lives in `to-sql.ts`, but Rails declares
   `visit_Arel_Nodes_Lateral` on the **PostgreSQL** visitor, not `ToSql`. There
   is no `postgresql.ts` in `packages/arel/src/visitors/`, so this is a
   file-layout divergence that `parity:api` matches on
   (`docs/ruby-ts-conventions.md` file-path rules).

## Acceptance criteria

1. `Lateral`'s node field is Rails' `expr` (`unary.rb`), coordinated with
   `arel-unary-operation-expr-rename` so the two do not conflict — if that
   story is claimed, fold this in there instead of opening a second PR.
2. `visitArelNodesLateral` reads `o.expr` and passes it to
   `groupingParentheses`, matching postgresql.rb:66.
3. Decide and record where the method belongs: either port
   `arel/visitors/postgresql.rb` as `packages/arel/src/visitors/postgresql.ts`
   and move it there, or `pnpm tasks block` this criterion with the specific
   blocker if the dialect visitor split cannot be done in one PR.
4. Generated SQL is byte-identical; `pnpm vitest run packages/arel` green;
   `pnpm parity:api` / `pnpm parity:api:extra --package arel` deltas
   non-negative.
