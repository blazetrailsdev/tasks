---
title: "bound-sql-literal-cast-bound-value-in-visitor"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3649
claim: "2026-06-19T15:06:39Z"
assignee: "bound-sql-literal-cast-bound-value-in-visitor"
blocked-by: null
---

## Context

Rails' `visit_Arel_Nodes_BoundSqlLiteral` (`arel/visitors/to_sql.rb:774-790`) wraps every non-Arel scalar in `@connection.cast_bound_value(value)` before calling `collector.add_bind(..., &bind_block)`. trails' `visitBindValue` in `packages/arel/src/visitors/to-sql.ts` (introduced/converged in PR #3641, story `bound-sql-literal-addbind-visitor`) routes scalars through `collector.addBind(value, this.bindBlock())` but passes the **raw** value — no `cast_bound_value`.

Two blockers prevent applying the cast in the visitor today:

1. `castBoundValue` is not a member of the `ArelConnection` boundary interface (`packages/arel/src/visitors/connection.ts`); the AR adapters implement it (`abstract-adapter.ts:757`, `abstract-mysql-adapter.ts:967`) but the default/mysql/stub quoters in `packages/arel/src/visitors/default-quoter.ts` do not.
2. `BoundSqlLiteral` is not yet wired into `buildWhereClause` (deferred to `converge-build-where-clause-bound-sql-literal`), so no runtime path currently consumes the cast — the only exerciser is `bind params to sql` via `conn.toSql` (SubstituteBinds → `this.quote`, which already casts at quote-time).

## Acceptance criteria

- [ ] Add `castBoundValue(value: unknown): unknown` to the `ArelConnection` interface and implement it on `defaultQuoter` / `mysqlDefaultQuoter` (identity is fine for the default; mysql returns the stringified numeric/bool per `connection-adapters/mysql/quoting.ts`).
- [ ] `visitBindValue` wraps each non-Arel scalar (including the per-element scalar in the mixed-array branch and the `add_binds` array branch) in `this.connection.castBoundValue(...)`, mirroring Rails' `new_bind` lambda.
- [ ] Remove the `DEVIATION (tracked)` note in `visitBindValue`.
- [ ] arel + bind-parameter tests pass; `bind params to sql` still produces the inlined `1, 2, 3` via SubstituteBinds.

## Notes

Surfaced during PR #3641 (story `bound-sql-literal-addbind-visitor`) Rails-source review.
