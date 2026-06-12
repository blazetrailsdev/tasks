---
title: "calculations: set from() on the count/aggregate manager pre-compile; drop applyFromClause regex + manual bind prepend"
status: draft
updated: 2026-06-11
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: ["from-clause-arel-manager"]
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

[[from-clause-arel-manager]] moved the main SELECT path's `from()` onto the
arel manager pre-compile (`_buildFromNode` → `SelectManager#from`). The
**calculations path never got the same treatment**:
`packages/activerecord/src/relation/calculations.ts` still post-processes
compiled SQL via `applyFromClause` (L265) — a `sql.replace(...)` regex swap of
the FROM-clause substring (matching ANSI- and backtick-quoted identifiers) on
the already-compiled aggregate SQL, with the subquery's binds **manually
prepended** to the bind array. It is called from ~9 sites (L332, L372, L506,
L551, L611, L643, L663, L682, L697) covering `count`, grouped calculations,
`sum`/`average`/etc., and
the distinct-id subquery path.

This is exactly the string-rewrite pattern RFC 0022 exists to remove (see RFC
"Cluster 3 — FROM on the manager pre-compile"): identifier quoting lives in
the regex instead of the visitor, bind ordering is hand-maintained (FROM binds
prepended, which only happens to be correct while nothing binds before FROM),
and CTEs never thread through.

Work: build each calculation's `SelectManager` with the FROM source applied
**before** compilation — reuse `Relation#_buildFromNode`
(`relation.ts` ~L4195) / `buildFrom` rather than reimplementing the
Relation/Node/string triage that `applyFromClause` duplicates (its own comment
admits it mirrors `relation.ts ~3550`). Then delete `applyFromClause` and the
manual `fromBinds` concatenation at every call site; `compileManagerWithBinds`
(L255) already returns visitor-collected binds in document order.

Rails counterpart: `active_record/relation/calculations.rb` builds aggregates
on the relation's arel (which already carries `build_from`) — there is no
Rails analog of `applyFromClause`; deleting it is itself an api:compare
hygiene win.

## Acceptance criteria

- [ ] `applyFromClause` is deleted from `relation/calculations.ts`; all ~9
      call sites compile a manager that carries the FROM source (and CTEs,
      where the relation has them) pre-compile.
- [ ] `count`/`sum`/grouped-calculation over `from("subquery")`,
      `from(relation)`, and a CTE relation produce Rails-identical SQL —
      assert via the ported calculation tests (un-skip any
      `BLOCKED: relation` calculation skips this closes; check
      `calculations.test.ts` and `with.test.ts` pluck/count deviations noted
      in PR #3105).
- [ ] Bind order is visitor-collected, not hand-prepended; PG `$N` numbering
      verified by running the touched tests against live PG locally.
- [ ] No test renames; `test:compare --cached --package activerecord` delta
      ≥ 0; ≤500 LOC.
