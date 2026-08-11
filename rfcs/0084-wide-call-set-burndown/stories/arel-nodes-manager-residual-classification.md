---
title: "arel-nodes-manager-residual-classification"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages:
  - arel
deps: []
deps-rfc: []
est-loc: null
pr: 6361
claim: "2026-08-11T14:16:14Z"
assignee: "arel-nodes-manager-residual-classification"
blocked-by: null
closed-reason: null
---

# Classify and converge arel nodes/manager residual rows (B1 slice 3/3)

## Context

B1 slice, from the 2026-08-04 re-measure (arel carries 41 live wide rows,
matching the baseline exactly). This slice is the 15 rows outside the
visitors — dominated by `new → constructor` rows that are probably the
constructor-idiom extractor gap, not divergence. The outcome here is
classification first, convergence second.

- `new` rows (11): `grouping_any` / `grouping_all` in
  `packages/arel/src/predications.ts`, `nodes/infix-operation.ts`,
  `nodes/node-expression.ts`, `nodes/sql-literal.ts` (Rails
  `vendor/rails/activerecord/lib/arel/predications.rb:239-247` builds
  `Nodes::Grouping.new` / `Or.new` / `And.new`); `order` / `partition` in
  `nodes/window.ts` (`vendor/rails/activerecord/lib/arel/nodes/window.rb`).
  Two sibling rows in `attributes/attribute.ts` were already reviewed as
  "Satisfied by a different path" (Predications mixin) — these are likely the
  same class. If the TS bodies do build the nodes via `new X()`, the row is
  the known constructor-idiom extractor gap: resolve via
  `@missingRailsCall` tag or file it against
  `0083-wide-call-ratchet-noise-reduction` as tooling artifact — do not
  hand-wave the baseline reason.
- `quoted_node` in `nodes/node-expression.ts` misses `build_quoted`
  (`vendor/rails/activerecord/lib/arel/nodes/node_expression.rb`), a real
  ported-helper delegation — converge.
- `lock` / `collapse` in `select-manager.ts` miss `sql`
  (`vendor/rails/activerecord/lib/arel/select_manager.rb:200`, `:257` —
  `Arel.sql(...)`) — check whether the TS bodies wrap via `new SqlLiteral`
  instead of the ported `sql` helper; converge to the helper.

Baseline rows retired: package `arel` — `predications.ts` `grouping_any` /
`grouping_all` [`new`]; `nodes/infix-operation.ts`, `nodes/node-expression.ts`,
`nodes/sql-literal.ts` same pair; `nodes/node-expression.ts` `quoted_node`
[`build_quoted`]; `nodes/window.ts` `order` / `partition` [`new`];
`select-manager.ts` `lock` / `collapse` [`sql`].

## Acceptance criteria

- Every row is resolved as exactly one of: converged (TS body makes the Rails
  call), reasoned `@missingRailsCall` at the call site, or filed against
  `0083-wide-call-ratchet-noise-reduction` as extractor artifact with the
  evidence. Never a broadened baseline reason.
- The listed wide baseline rows are deleted by hand (only-shrink; no
  `--write` reseed).
- Single PR under the LOC ceiling; non-overlapping with the two visitor
  slices.
