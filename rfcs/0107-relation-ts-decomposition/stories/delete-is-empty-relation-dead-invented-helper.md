---
title: "Delete _isEmptyRelation — dead invented alias for Rails' null_relation? (isNullRelation)"
status: done
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: 6735
claim: "2026-08-19T11:35:05Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation.ts:2692` carries:

```ts
/** @internal */
_isEmptyRelation(): boolean {
  return this._isNone;
}
```

Two problems, both verified on `origin/main`:

1. **No Rails counterpart.** There is no `empty_relation?` under
   `vendor/rails/activerecord/lib/active_record/`. Rails' predicate for this
   state is `null_relation?`
   (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1293`),
   read at `relation.rb:1438` and `relation/merger.rb:70`. trails already ports
   it faithfully as `Relation#isNullRelation` (`relation.ts:3254`), and that is
   the spelling the rest of the package uses.

2. **Zero callers.** `git grep _isEmptyRelation origin/main -- packages/activerecord scripts`
   returns exactly one hit: the definition itself. Nothing in
   `packages/activerecord/src`, the association suites, `dx-tests`, or
   `scripts/` reads it.

It carries no `@noRailsEquivalent` tag, only `@internal`, so it is untracked
invented surface rather than a knowingly-deferred deviation — invisible to
both gates, and measurably so: on a fresh build at `37e36d782`,
`pnpm parity:api:extra --package activerecord` lists `relation.ts`'s full extra
set as five names — novel `new`, `toArel`; moved `distinctOn`, `isPresent`,
`presence` — and `_isEmptyRelation` is not among them, because
underscore-prefixed members are not scored. The call-set gate cannot see it
either: it has no Rails-named body to score inside, and
`parity:api:calls` reports OK on main.

## Converged shape

Delete `_isEmptyRelation`. `isNullRelation()` is the Rails-named predicate and
already covers every real read; a second spelling of the same one-line field
read is exactly the kind of duplicate private helper this RFC exists to burn
down.

If a caller appears during the work, respell it to `isNullRelation()` rather
than keeping the alias.

## Acceptance criteria

- [ ] `_isEmptyRelation` is gone from `packages/activerecord/src/relation.ts`.
- [ ] `git grep _isEmptyRelation packages/ scripts/` is empty.
- [ ] No behavior change: `pnpm vitest run packages/activerecord/src/relation`
      and the association suites pass unchanged.
- [ ] `pnpm typecheck` clean; `pnpm parity:api` still reports
      `relation.rb → relation.ts` at 401/401 (100%) and
      `parity:api:extra` still shows `relation.ts` at 2 novel / 3 moved
      (deleting an unscored member must not move the score);
      `parity:api:calls` / `:args` ratchets stay OK; `parity:test` delta
      non-negative.
