---
title: "Seed the call-argument exclude baseline on main"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: ["call-args-ratchet-and-ci-step"]
deps-rfc: []
est-loc: null
priority: null
pr: 6343
claim: "2026-08-10T15:43:28Z"
assignee: "call-args-arel-population-recheck"
blocked-by: null
closed-reason: null
---

## Context

Seed the call-argument rows of the `scripts/api-compare/call-mismatches-exclude/`
baseline for the call-argument gate (`call-args-ratchet-and-ci-step`), on `main`,
as its own PR — the same shape as every prior baseline seed in this repo.

Rows go into the **existing** per-file shards next to the call-set rows for the
same source file, carrying `kind: "args"` (decision reversed 2026-08-10; see
`call-args-rows-share-existing-shards`). There is no
`call-mismatches-args-exclude/` tree.

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
  23 call sites, invisible to `arity.ts`, `parity:api` and `parity:api:calls`.
- `to-sql.ts` `appendEscape` (`:1044`) is an extracted helper Rails does not
  have (`to_sql.rb:485-495`).
- `UnaryOperation.operand` (`unary-operation.ts:19`) shadows Rails'
  `Unary#expr` (`unary.rb:6`).

## Acceptance criteria

1. Rows are seeded from a forced full-scope run (`API_COMPARE_FORCE=1`) into
   the existing `call-mismatches-exclude/<package>/<path>.json` shards, each
   carrying `kind: "args"`, written via `serializeBaseline`.
2. The call-set gate's row count is unchanged by the seed — seeding the
   argument dimension must not move RFC 0084's debt metric.
3. Only `shape`-class rows are seeded; `naming` rows are not.
4. The argument-row count is recorded in the RFC 0025 changelog as the burndown floor.
5. `pnpm parity:api:calls:args` is green on `main` immediately after the seed.
6. The three convergence targets above are filed as stories against the RFCs
   owning `packages/arel/` — not fixed in this PR.
