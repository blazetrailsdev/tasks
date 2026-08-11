---
title: "B1: converge arel visitor helper calls"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
packages:
  - arel
deps:
  - arel-tosql-statement-visitor-helper-calls
  - arel-dialect-visitor-helper-calls
  - arel-nodes-manager-residual-classification
deps-rfc: []
est-loc: 400
pr: 6378
claim: "2026-08-11T21:06:02Z"
assignee: "burndown-arel-visitors"
blocked-by: null
closed-reason: null
---

## Context

Rails' arel visitors route shared work through `collect_nodes_for`,
`maybe_visit` and `infix_value`; several trails visitors inline that work
instead of calling the ported helper. Confirmed example:
`visit_Arel_Nodes_DeleteStatement` (Rails) uses `collect_nodes_for` for its
WHERE clause and `maybe_visit` for its limit, while
`packages/arel/src/visitors/to-sql.ts:211` `visitArelNodesDeleteStatement`
inlines both. Same pattern in `visit_Arel_Nodes_UpdateStatement`,
`visit_Arel_Nodes_InsertStatement`, `visit_Arel_Nodes_SelectStatement`,
`visit_Arel_Nodes_Window`, and in the dialect visitors
(`visitors/mysql.ts`, `visitors/postgresql.ts`, `visitors/sqlite.ts`) for
`infix_value` and `visit`.

~90 rows projected after the sibling RFC's noise reduction. Chosen as the first
bundle: self-contained, mechanical, no cross-cutting state.

## Acceptance criteria

- Re-measure first with `pnpm parity:api:calls --report` — the ~90 figure is a
  projection from 2026-07-30 probe runs, not a live count.
- Split into ~3 PRs, each under the LOC ceiling, each branching from `main`
  with non-overlapping files. Register the slices as follow-up stories under
  this RFC rather than opening them all from one agent.
- Each converged visitor calls the ported helper Rails calls; behavior is
  verified against `vendor/rails/activerecord/test/cases/arel/` and the trails
  arel tests, not by the ratchet alone.
- Baseline entries for converged rows are removed (not re-reasoned).
- Any row that turns out to be a correct deviation gets a reasoned
  `@missingRailsCall` tag at the call site, and the PR body says why.

- **Check for an existing owner before claiming any slice.** The 2026-07-30
  survey found that 42% of open fidelity stories already own a file the wide
  list flags. If an open story in another RFC owns the file, the wide row
  belongs there as an acceptance criterion — not in a second campaign against
  the same file.
