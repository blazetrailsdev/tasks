---
title: "Delete WhereChain#exists — invented surface with no Rails counterpart and no callers"
status: done
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: 6733
claim: "2026-08-19T00:11:25Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `invert-where-chain-trio-onto-wherechain` (PR #6686),
which moved the real bodies onto `WhereChain` and made its member list easy to
compare against the Ruby.

Rails' `WhereChain`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:13-148`)
has exactly four methods and one private helper:

| Rails member                             | line   |
| ---------------------------------------- | ------ |
| `initialize(scope)`                      | `:14`  |
| `not(opts, *rest)`                       | `:49`  |
| `associated(*associations)`              | `:88`  |
| `missing(*associations)`                 | `:124` |
| `scope_association_reflection` (private) | `:140` |

trails' `WhereChain` (`packages/activerecord/src/relation/query-methods.ts`)
carries a fifth public method Rails does not have:

```ts
exists(conditions?: unknown): Promise<boolean> {
  return (this._scope as any).exists(conditions);
}
```

It is a bare delegation to the scope's own `exists`, so `Post.where().exists()`
and `Post.where({}).exists()` reach the same implementation by two spellings —
only the first of which has no Rails counterpart. Rails reaches `exists?`
through `Relation`/`FinderMethods`, never through the `WhereChain` placeholder.

Measured on the merge commit of #6686: **zero callers** in
`packages/activerecord/src`, `packages/activerecord/dx-tests`, or `scripts/`.
It carries no `@noRailsEquivalent` tag, so it is untracked invented surface
rather than a knowingly-deferred deviation.

## Converged shape

Delete `WhereChain#exists`. Nothing calls it, and `Relation#exists` already
covers every real call site.

If a caller turns up during the work, it should be respelled to reach `exists`
on the relation (`where({...}).exists()` / `Model.exists?`) rather than through
the placeholder, matching how Rails' own `exists?` is reached.

## Acceptance criteria

- [ ] `WhereChain#exists` is gone, and `WhereChain`'s member list matches
      `query_methods.rb:13-148` exactly.
- [ ] `pnpm parity:api:extra --package activerecord` does not gain a row; the
      novel count for `relation/query-methods.ts` drops if `exists` was scored.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
