---
title: "Remove non-Rails set-operation methods (union/unionAll/intersect/exceptRelation) from Relation"
status: claimed
updated: 2026-07-06
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: "2026-07-06T17:30:12Z"
assignee: "relation-remove-non-rails-set-operation-methods"
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

Confirmed non-Rails methods on `Relation` (trails `packages/activerecord/src/relation.ts`,
verified against `origin/main` 2026-07-06):

- `union(other)` — `relation.ts` ~1845. Mirrors `Arel::SelectManager#union`, not any
  `ActiveRecord::Relation#union` (which doesn't exist).
- `unionAll(other)` — `relation.ts` ~1855. No Rails `Relation#union_all`.
- `intersect(other)` — `relation.ts` ~1866. No Rails `Relation#intersect`.
- `exceptRelation(other?)` — `relation.ts` ~1882. The SQL `EXCEPT` set operation, marked
  `@internal` / "no Rails equivalent".

**Note — the `except` shadowing described in the original draft is already fixed.**
PR #4052 (_"converge Relation#except to Rails SpawnMethods#except"_, merged 2026-06-24)
already made `Relation#except(*skips)` the real Rails value-key remover
(`spawn_methods.rb:59`) and **relocated** the SQL `EXCEPT` operation to the dedicated
`exceptRelation` method. So there is no longer a mis-bound `except` and no missing
`except`/`only` — that reconciliation is done. What remains is purely the removal of the
four non-Rails set-operation methods and the machinery that serves only them.

Supporting machinery introduced only to serve these methods (remove with them):
`_setOperation` field (`relation.ts:550`, `type: "union" | "unionAll" | "intersect" |
"except"`) + `_buildSetOperationNode` / `_buildSetOperationOperandManager` /
`_toSqlSetOperation`, and the set-op branches threaded through `toArray`, `toSql`,
`_cteBodyArelNode`, `_buildFromNode`, `_eagerLoadBypassesJoinDependency`, and
`relation/query-methods.ts` (the `if (opts._setOperation)` branch at ~`:2449`).

**No internal callers.** A monorepo grep (`origin/main`, non-test) finds no `.union(` /
`.unionAll(` / `.intersect(` / `.exceptRelation(` call sites on a `Relation` — the only
`.union(` hits are `WhereClause#union` (unrelated). So removal does not require fixing
any internal use. Tests: the "set operations" describe in `relations.test.ts` (union
execution cases) and the set-op cases in `relation/arel-ast-convergence.test.ts`.

## Acceptance criteria

- [ ] Audit `Relation`'s public surface for methods with no `ActiveRecord::Relation`
      counterpart (start from the four above; verify each remaining public method against
      the Rails source / `api:compare`). Produce the list before deleting.
- [ ] Remove `union`, `unionAll`, `intersect`, and `exceptRelation` from `Relation`, plus
      the `_setOperation` machinery that exists solely to support them
      (`_setOperation` field, `_buildSetOperationNode`,
      `_buildSetOperationOperandManager`, `_toSqlSetOperation`, and the set-op branches in
      `toArray` / `toSql` / `_cteBodyArelNode` / `_buildFromNode` /
      `_eagerLoadBypassesJoinDependency` / `query-methods.ts`), and the corresponding
      non-Rails tests. `api:compare` / `test:compare` delta must stay non-negative (these
      are non-Rails methods + non-Rails tests, so removal loses no parity coverage).
- [ ] Confirm no callers remain (grep the monorepo — expected already clean per the audit
      above; re-verify and remove any that appear).
- [ ] Update / delete any "Mirrors: `Arel::SelectManager#union`/…" JSDoc left orphaned by
      the removal.

## Notes

- `except`/`only` Rails-semantics reconciliation is **already done** (PR #4052) — this
  story is now purely a removal, not a reconciliation.
- PR #3398 (the eager-UNION enhancement) and its dependency story
  `set-operations-eager-joindependency-composition` are abandoned in favor of this
  convergence. `set-operations-cte-eager-ast` (PR #3187) introduced the original
  `Relation#union` surface and should be considered in the audit.
- If product reasons to keep a set-operation API emerge, the fidelity-consistent path is
  to expose it where Rails does (Arel `SelectManager`), not on `Relation`.
