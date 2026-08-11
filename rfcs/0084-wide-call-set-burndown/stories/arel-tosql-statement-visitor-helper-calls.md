---
title: "arel-tosql-statement-visitor-helper-calls"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages:
  - arel
deps: []
deps-rfc: []
est-loc: null
pr: 6362
claim: "2026-08-11T14:26:06Z"
assignee: "arel-tosql-statement-visitor-helper-calls"
blocked-by: null
closed-reason: null
---

# Converge to-sql.ts statement-visitor helper calls (B1 slice 1/3)

## Context

B1 slice, from the 2026-08-04 re-measure (`API_COMPARE_FORCE=1 pnpm parity:api
--wide-calls` on a full build; arel carries 41 live wide rows, matching the
baseline exactly). This slice is the 14 rows confined to
`packages/arel/src/visitors/to-sql.ts` — one file, one PR, mechanical.

Rails routes shared statement-clause work through `collect_nodes_for` /
`maybe_visit` / `inject_join`; the trails visitors inline it:

- `visitArelNodesDeleteStatement` (`packages/arel/src/visitors/to-sql.ts:217`)
  and `visitArelNodesUpdateStatement` (`to-sql.ts:254`) call `injectJoin`
  directly (`to-sql.ts:243`, `to-sql.ts:265`, `to-sql.ts:276`) where Rails'
  `visit_Arel_Nodes_DeleteStatement` / `UpdateStatement`
  (`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:22`, `:46-50`) use
  `collect_nodes_for` and `maybe_visit o.limit`.
- `visitArelNodesInsertStatement` (`to-sql.ts:287`) misses the `maybe_visit`
  calls Rails makes at `to_sql.rb:68-70`.
- `visitArelNodesSelectStatement` (`to-sql.ts:401`) does not delegate to
  `visitArelNodesSelectCore` / `visitArelNodesSelectOptions` the way
  `to_sql.rb:144-146` does (comment at `to-sql.ts:440-452` documents the
  deliberate inlining).
- Also flagged: `visit_Arel_Nodes_Window` (`collect_nodes_for`),
  `visit_Arel_Nodes_Over` (`infix_value`), `visit_Arel_Nodes_And` /
  `visit_Arel_Nodes_Or` / `visit_Array` (`inject_join`,
  `to_sql.rb:179-182` is the helper), `collect_optimizer_hints`
  (`maybe_visit`), and `compile` (`accept`).

Baseline rows retired (all in
`scripts/api-compare/call-mismatches-wide-exclude/`, package `arel`, file
`visitors/to-sql.ts`): `visit_Arel_Nodes_DeleteStatement`
[`collect_nodes_for`, `maybe_visit`], `visit_Arel_Nodes_UpdateStatement`
[`collect_nodes_for`, `maybe_visit`], `visit_Arel_Nodes_InsertStatement`
[`maybe_visit`], `visit_Arel_Nodes_SelectStatement`
[`visit_Arel_Nodes_SelectCore`, `visit_Arel_Nodes_SelectOptions`],
`visit_Arel_Nodes_Window` [`collect_nodes_for`], `visit_Arel_Nodes_Over`
[`infix_value`], `visit_Arel_Nodes_And` [`inject_join`],
`visit_Arel_Nodes_Or` [`inject_join`], `visit_Array` [`inject_join`],
`collect_optimizer_hints` [`maybe_visit`], `compile` [`accept`].

## Acceptance criteria

- Each listed method routes through the ported helper exactly as its Rails
  body does (same call, same order); no bare inlining remains, or — only where
  the port is genuinely right and the Rails call genuinely does not apply — a
  reasoned `@missingRailsCall` tag at the call site. Never a broadened
  baseline reason.
- The wide baseline rows listed above are deleted by hand (only-shrink; no
  `--write` reseed).
- `pnpm vitest run` on the arel visitor test files stays green; bodies
  verified against `vendor/rails/activerecord/lib/arel/visitors/to_sql.rb`.
- Single PR under the LOC ceiling, this file only (non-overlapping with
  the dialect-visitor slice).
