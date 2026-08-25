---
title: "invert-where-chain-trio-onto-wherechain"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6686
claim: "2026-08-18T02:31:51Z"
assignee: "invert-where-chain-trio-onto-wherechain"
blocked-by: null
closed-reason: null
---

## Context

Split out of `fan-out-query-methods-where-family` (PR pending), which moved the
`where` / `rewhere` / `or` / `and` / `excluding` / `invertWhere` /
`structurallyCompatible` family into `relation/query-methods.ts` and deleted the
trails-only `whereAny` / `whereAll`. That PR reached its LOC ceiling; this
remainder is the WhereChain trio inversion, unchanged in scope.

Three where-family members are real Rails features carried under a **name Rails
does not have**, which is why `pnpm parity:api:extra` scores each as novel
surface on `relation.ts` (and, via the delegating wrappers, on
`relation/query-methods.ts`).

Rails puts all three on `WhereChain`, reached as `where.not(...)` /
`where.associated(...)` / `where.missing(...)`:

| Rails                   | vendored `query_methods.rb` | trails flattened host      |
| ----------------------- | --------------------------- | -------------------------- |
| `WhereChain#not`        | `:49`                       | `Relation#whereNot`        |
| `WhereChain#associated` | `:88`                       | `Relation#whereAssociated` |
| `WhereChain#missing`    | `:124`                      | `Relation#whereMissing`    |

trails **already has a faithful `WhereChain`** at
`packages/activerecord/src/relation/query-methods.ts:51`, ported from those exact
Rails lines — including the `scopeAssociationReflection` fail-fast that mirrors
`query_methods.rb:90`. But the direction is inverted: `WhereChain#not` /
`#associated` / `#missing` are thin wrappers that delegate _outward_ to
`this._scope.whereNot(...)` / `.whereAssociated(...)` / `.whereMissing(...)`,
where the real bodies live. In Rails the bodies are in `WhereChain` and
`Relation` has no such methods at all.

The convergence is to invert that: move the bodies into the `WhereChain` methods
at the Rails names, and retire the flattened trio from `Relation`'s public
surface. `WhereChainScope<R>` exists only to type the outward delegation and
goes with them. `Relation#_whereChainReflection` (relation.ts) is the duplicate
of `WhereChain#scopeAssociationReflection` and goes too.

Note Rails' `associated` / `missing` mutate `@scope` in place (`joins!`,
`left_outer_joins!`, `where!`) and return `@scope`; trails' `whereAssociated` /
`whereMissing` clone per iteration. Converge to the Rails in-place shape.

Known callers to update (~40 sites, `whereNot` dominating):

- `packages/activerecord/src/` — `validations/uniqueness.ts`, `enum.ts`,
  `relation.ts`, `relation/query-methods.ts`, test-helper models
  (`post.ts`, `topic.ts`, `company.ts`), and the test files listed by
  `grep -rn "whereNot(\|whereAssociated(\|whereMissing(" --include=*.ts`.
- `packages/activerecord/dx-tests/query-chaining.test-d.ts`.
- `relation.ts` and `relation/merged-join-alias-tracker.ts` — comments
  referencing `whereAssociated`; update the prose to the Rails spelling.
- `scripts/parity/pipeline/fixtures/ar-36/query.ts` and `ar-37/query.ts` — the
  TS halves spell `Book.all().whereMissing("author")` /
  `.whereAssociated("author")` while their `query.rb` counterparts already spell
  `Book.where.missing(:author)` / `.associated(:author)`. Converging the TS side
  makes the fixture pair match, which is the point of the fixture.

Do **not** delete the feature — an earlier note claimed these were absent from
vendored Rails; that was a bad grep (`where_associated` finds nothing because
Rails never spells it that way) and the claim is withdrawn.

## Acceptance criteria

- `WhereChain#not` / `#associated` / `#missing` carry the bodies, ported from
  `query_methods.rb:49` / `:88` / `:124`.
- `Relation#whereNot` / `#whereAssociated` / `#whereMissing`,
  `WhereChainScope<R>`, and `Relation#_whereChainReflection` are gone.
- Every caller (source, tests, dx-tests, parity fixtures) spells
  `where().not(...)` / `where().associated(...)` / `where().missing(...)`.
- `pnpm parity:api:extra --package activerecord` drops the three
  `relation.ts` / `relation/query-methods.ts` novel rows.
- `relation/where-chain.test.ts`, `where.test.ts`, `composite-where.test.ts`,
  `merging.test.ts` pass unchanged; `pnpm parity:api` / `parity:test` deltas
  non-negative; `pnpm parity:api:calls` / `:args` clean.
