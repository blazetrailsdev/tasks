---
title: "Seed the call-argument exclude baseline on main"
status: draft
updated: 2026-08-09
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: ["call-args-ratchet-and-ci-step"]
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

Seed the `scripts/api-compare/call-mismatches-args-exclude/` baseline for the
call-argument gate (`call-args-ratchet-and-ci-step`), on `main`, as its own PR —
the same shape as every prior baseline seed in this repo.

The spike (RFC 0025 `## Call-argument fidelity`) measured 70 flagged rows on
`arel` and 510 on `activerecord`; ~45% of those are `shape`-class and therefore
in scope for the seed. The remaining packages have not been measured.

Rows are generated, so the diff is large and mechanical; the debt metric is the
row count and rows converge by deletion, per RFC 0084's decision.

Known convergence targets already identified by the spike, to be filed against
the RFCs that own those files once the baseline exists:

- The arel visitor-helper family moved `collector` to the **last** parameter —
  Rails `inject_join(list, collector, join_str)` (`to_sql.rb:897`) vs
  `injectJoin(nodes, connector, collector)` (`to-sql.ts:654`), plus
  `collect_nodes_for` (`:179`), `infix_value` (`:957`),
  `infix_value_with_paren` (`:963`), `grouping_parentheses` (`:981`).
  23 call sites, invisible to `arity.ts`, `api:compare` and `api:calls`.
- `to-sql.ts` `appendEscape` (`:1044`) is an extracted helper Rails does not
  have (`to_sql.rb:485-495`).
- `UnaryOperation.operand` (`unary-operation.ts:19`) shadows Rails'
  `Unary#expr` (`unary.rb:6`).

## Acceptance criteria

1. `call-mismatches-args-exclude/` is seeded from a forced full-scope run
   (`API_COMPARE_FORCE=1`), sharded per file like the calls baseline.
2. Only `shape`-class rows are seeded; `naming` rows are not.
3. The row count is recorded in the RFC 0025 changelog as the burndown floor.
4. `pnpm api:calls:args` is green on `main` immediately after the seed.
5. The three convergence targets above are filed as stories against the RFCs
   owning `packages/arel/` — not fixed in this PR.
