---
title: "Remove non-Rails set-operation methods (union/unionAll/intersect/except) from Relation; reconcile except with Rails semantics"
status: draft
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: []
deps-rfc: []
est-loc: 300
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while reviewing PR #3398 (closed unmerged), which tried to enhance the
set-operation API by composing eager-load operands as a JoinDependency-instantiated
UNION. The review raised the deeper question: **`Relation#union` and friends are not
part of Rails' public `ActiveRecord::Relation` API at all** — they exist only on
`Arel::SelectManager` (`#union`, `#union_all`, `#intersect`, `#except`). The upstream
proposals to lift them onto `ActiveRecord::Relation` were closed (e.g. rails/rails#27340).
So trails carries non-Rails surface on `Relation`, and the prior work was _enhancing a
deviation_ rather than porting anything. The project is fidelity-first ("always converge,
never ratify"), so the correct move is to remove the non-Rails methods, not extend them.

Confirmed non-Rails methods on `Relation` (trails `packages/activerecord/src/relation.ts`):

- `union(other)` — relation.ts:1498. Comment claims `Mirrors: ActiveRecord::Relation#union`,
  but Rails `Relation` has no `#union`; this mirrors `Arel::SelectManager#union`.
- `unionAll(other)` — relation.ts:1509. Same: no Rails `Relation#union_all`.
- `intersect(other)` — relation.ts:1520. Same: no Rails `Relation#intersect`.
- `except(other)` — relation.ts:1531. **This is worse than an extra method: it shadows a
  real Rails method.** Rails `ActiveRecord::SpawnMethods#except(*skips)` removes query
  parts (e.g. `Post.order(:name).except(:order)`) and `#only(*onlies)` keeps only the
  named parts (`spawn_methods.rb`). trails repurposed the name `except` for SQL EXCEPT
  with a relation arg (comment at relation.ts:1668 even admits "our except is SQL EXCEPT,
  not query-part removal"; the JSDoc says `Mirrors: …#except_` with a bogus trailing
  underscore). trails' `spawn-methods.ts` is missing the real `except`/`only` entirely.

Supporting machinery introduced only to serve these methods (candidates for removal once
the public methods go): `_setOperation` field + `_buildSetOperationNode` /
`_buildSetOperationOperandManager` / `_toSqlSetOperation` and the set-op branches threaded
through `toArray`, `toSql`, `_cteBodyArelNode`, `_buildFromNode`, `_eagerLoadBypassesJoinDependency`,
and `relation/query-methods.ts`. Tests: `relations.test.ts` "set operations" describe block,
the union execution tests (~line 2677+), and the set-op cases in `relation/arel-ast-convergence.test.ts`.

## Acceptance criteria

- [ ] Audit `Relation`'s public surface for methods with no `ActiveRecord::Relation`
      counterpart (start from the four above; verify each remaining public method against
      the Rails source / `api:compare`). Produce the list before deleting.
- [ ] Remove `union`, `unionAll`, `intersect`, and the SQL-EXCEPT `except(other)` from
      `Relation`, plus the `_setOperation` machinery that exists solely to support them,
      and the corresponding tests. `api:compare` / `test:compare` delta must stay
      non-negative (these are non-Rails methods + non-Rails tests, so removal does not
      lose parity coverage).
- [ ] Reconcile `except`: restore Rails' real `ActiveRecord::SpawnMethods#except(*skips)`
      (query-part removal) and `#only(*onlies)` so the name maps to Rails semantics. If
      that is larger than one PR, split it into its own story and remove the SQL-EXCEPT
      `except` here so the name is at least no longer mis-bound.
- [ ] No callers left referencing the removed methods (grep the monorepo; fix or remove
      any internal uses).
- [ ] Update any "Mirrors: ActiveRecord::Relation#union/…/#except\_" JSDoc that asserted a
      non-existent Rails counterpart.

## Notes

- PR #3398 (the eager-UNION enhancement) and its dependency story
  `set-operations-eager-joindependency-composition` are abandoned in favor of this
  convergence. `set-operations-cte-eager-ast` (PR #3187) introduced the original
  `Relation#union` surface and should be considered in the audit.
- If product reasons to keep a set-operation API emerge, the fidelity-consistent path is
  to expose it where Rails does (Arel `SelectManager`), not on `Relation`.
