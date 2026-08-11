---
title: "to_sql visitors: pass the node attributes Rails passes, not invented locals"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6371
claim: "2026-08-11T17:56:00Z"
assignee: "converge-relation-where-clause-writer"
blocked-by: null
closed-reason: null
---

## Context

The ten remaining `class: "naming"` rows for
`packages/arel/src/visitors/to-sql.ts` after PR #6358 converged the file's
`node`→`o` parameter naming (30 → 12 rows; the other two are body locals, filed
separately). These are NOT naming preferences — each is a call site passing a
different VALUE than Rails passes, which the naming class surfaces because the
argument is a `ref:`. PR #6358's acceptance criterion 4 explicitly deferred them
rather than renaming them away.

Rows, with the Rails source each diverges from
(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb`):

- `visit_Arel_Nodes_Grouping` (`:733`) — Rails visits `o.expr` once; the port
  runs an array-flattening loop visiting `item` / `inner` (2 rows). The loop is
  invented: Rails has no array arm here.
- `visit_Arel_Nodes_Over` (`:394`) — Rails is
  `quote_column_name(o.right.to_s)`; the port passes `right` itself (1 row).
- `visit_Arel_Attributes_Attribute` (`:840`) — Rails
  `quote_table_name(join_name)`; the port passes a local `tbl` computed
  differently (1 row).
- `quote_table_name` / `quote_column_name` (`:867-876`) — Rails passes `name`
  straight through; the port wraps it in an invented `rubyToS(name)` conversion
  (2 rows).
- `visit_Arel_Nodes_HomogeneousIn` (`:600`), `visit_Arel_Nodes_UnaryOperation`
  (`:817`), `visit_Arel_Nodes_DeleteStatement` (`:22`) — each visits a local the
  port computed (`attribute`, `operand`, `joinSourceLeft`) where Rails visits the
  node's own attribute (`o.left`, `o.expr`, `o.relation.left`) (3 rows).

## Converged shape

Each call site passes what Rails passes, off the node, with the intermediate
local deleted where it only renamed an attribute read. The `Grouping` loop and
the `rubyToS` conversions are the two that need a real behavioural check first —
confirm against `vendor/rails/activerecord/test/cases/arel/visitors/to_sql_test.rb`
that the Rails shape covers the cases the invented arm was added for, and if it
does not, the divergence is a bug in a DIFFERENT method and should be filed as
such rather than absorbed here.

## Acceptance criteria

1. Every row above either converges or is replaced by a filed story naming the
   real defect, with the Rails `file:line` and a failing-on-baseline test.
2. `naming` rows for `visitors/to-sql.ts` drop from 10 (excluding the two body
   locals) accordingly; report before/after.
3. `pnpm parity:api:calls`, `pnpm parity:api:calls:args` green; arel visitor
   tests green.
