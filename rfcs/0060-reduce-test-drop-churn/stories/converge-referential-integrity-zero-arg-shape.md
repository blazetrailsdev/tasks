---
title: "converge-referential-integrity-zero-arg-shape"
status: ready
updated: 2026-07-04
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
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

PR #4543 (story `pg-scope-referential-integrity-to-loaded-tables`) added an
optional `tables?: string[]` parameter to trails' `disableReferentialIntegrity`
so hot fixture-load / truncate callers can scope the FK-trigger toggle to the
tables they actually touch instead of `this.tables()` over the whole catalog
(the dominant PG DDL cost — 69% of PG DDL ms).

This parameter has **no Rails counterpart**: `disable_referential_integrity` is
zero-arg in every adapter —
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/referential_integrity.rb:7`,
`sqlite3_adapter.rb:255`, `abstract_mysql_adapter.rb:212`. Rails avoids the
per-call cost structurally: fixture loading is a single bulk
`insert_fixtures_set` per run (`fixtures.rb:684`) inside one
`disable_referential_integrity` block, whereas trails fires the wrapper per
load/truncate event (~84k times under RFC 0060's per-test reset).

Per repo policy (never ratify an intentional divergence in a code comment
alone), this is tracked as a deviation-pending-convergence rather than left as
the doc comment at
`packages/activerecord/src/connection-adapters/postgresql/referential-integrity.ts:74-82`.

Deviation surface:

- `referential-integrity.ts:10,83` — `ReferentialIntegrity` interface + fn add
  `tables?: string[]`.
- `abstract/database-statements.ts:125` — `DatabaseStatementsHost` mirrors it.
- Call sites `database-statements.ts` `truncateTables` / `insertFixturesSet`
  pass the scoped set.

The no-arg form still falls back to `this.tables()`, so the public
`disable_referential_integrity` contract is preserved; only the extra optional
parameter diverges.

## Acceptance criteria

- Converge to Rails' zero-arg shape, OR document why the scoping parameter must
  remain (e.g. trails' per-event wrapper granularity is structural and cannot be
  hoisted to one-block-per-run like Rails).
- Preferred convergence path: hoist the trails fixture-load / reset flow to a
  single `disableReferentialIntegrity` block per fixture set (matching Rails'
  `insert_fixtures_set` shape), after which the `tables?` parameter can be
  dropped and the whole-catalog toggle amortizes to one call per run.
- If convergence is infeasible, record the structural reason in the RFC and keep
  the parameter, but remove it from the deviation ledger only with that
  justification.
- PG lane green; `test:compare` delta >= 0.
