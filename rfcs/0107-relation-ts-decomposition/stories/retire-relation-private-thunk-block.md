---
title: "Retire the ~330-line private thunk block in relation.ts"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6590
claim: "2026-08-16T01:45:03Z"
assignee: "wave-2c-grouped-calculation-and-query-method-stores"
blocked-by: null
closed-reason: null
---

## Context

`relation.ts:6967-7295` is a block of ~60 one-line private wrappers whose only
job is to make helpers implemented in sibling modules reachable as `this.x()`:

```ts
private buildWhereClause(opts: unknown, rest: unknown[] = []): unknown {
  return _qm.buildWhereClause.call(this as any, opts, rest);
}
```

They delegate to `relation/query-methods.ts` (`buildWhereClause`,
`buildNamedBoundSqlLiteral`, `buildBoundSqlLiteral`, `buildSubquery`,
`buildCastValue`, `flattenedArgs`, `validateOrderArgs`, `processWithArgs`,
`isDoesNotSupportReverse`, `reverseSqlOrder`, `extractTableNameFrom`,
`columnReferences`, `sanitizeOrderArguments`, `preprocessOrderArgs`,
`buildOrder`, `buildCaseForValuePosition`, `resolveArelAttributes`,
`orderColumn`, `processSelectArgs`, `arelColumnAliasesFromHash`, `buildFrom`,
`buildSelect`, `buildWithExpressionFromValue`, `buildWithValueFromHash`,
`lookupTableKlassFromJoinDependencies`, `eachJoinDependencies`,
`buildJoinDependencies`, `buildArel`, `selectNamedJoins`,
`selectAssociationList`, `buildJoinBuckets`, `buildJoins`, `buildWith`,
`buildWithJoinNode`, `structurallyIncompatibleValuesFor`),
`relation/finder-methods.ts` (`constructRelationForExists`, `findWithIds`,
`findOne`, `findSome`, `findSomeOrdered`, `findTake`, `findTakeWithLimit`,
`findNth`, `findNthWithLimit`, `findNthFromLast`, `findLast`, `orderedRelation`,
`_orderColumns`), `relation/batches.ts` (`actOnIgnoredOrder`) and
`relation/spawn-methods.ts` (`relationWith`).

Rails gets all of this free from `include FinderMethods, Calculations,
SpawnMethods, QueryMethods, Batches, Explain, Delegation`
(`vendor/rails/activerecord/lib/active_record/relation.rb:68`). There is no
Ruby counterpart to any wrapper.

CLAUDE.md's "Module mixins" section already prescribes the trails idiom for
instance methods mixed in bulk: `include()` / `Included<>` from
`@blazetrails/activesupport`. `relation.ts` already applies it to the _public_
surface — the three `export interface Relation<T extends Base>` declaration
merges at `relation.ts:7297`, `:7324`, `:7385`. The private half was never
migrated, so it carries a hand-written thunk instead.

Note `buildArel` (`relation.ts:7134`) is one of these thunks and is currently
unreached — see the F1 story; do not delete it here, that story owns it.

## Acceptance criteria

- The wrapper block at `relation.ts:6967-7295` is gone; the sibling-module
  private helpers reach `this` via `include()` / `Included<>`, matching the
  idiom the public surface already uses in the same file.
- No behavior change: `pnpm vitest run packages/activerecord/src/relation` and
  the `relation/*.test.ts` files pass unchanged.
- `relation.ts` drops ~330 lines.
- `pnpm parity:api` and `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `pnpm parity:api:calls:args` clean (no new rows).
- No baseline reseed; if a row in
  `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
  converges as a side effect, delete that one row by hand and run
  `pnpm parity:api:calls:tighten activerecord/relation.json`.
