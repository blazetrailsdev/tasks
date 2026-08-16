---
title: "Move the query_methods.rb members out of relation.ts into query-methods.ts"
status: closed
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["retire-relation-private-thunk-block"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded: measured 794 lines / 70 members against its 600-LOC estimate. Split on query_methods.rb source-order groupings into fan-out-query-methods-{where-family,order-and-projection,flags-and-annotations,joins-eager-and-cte}, which together cover the same population with no overlap."
---

## Context

1,226 lines / 144 members of `relation.ts` implement methods whose Rails
counterpart is in `vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`,
not `relation.rb`. `packages/activerecord/src/relation/query-methods.ts`
already exists (3,100 lines) and is where they belong.

The parked members, with their `relation.ts` line and Rails counterpart in
`query_methods.rb`:

- `where` (`:515`), `rewhere` (`:602`, Rails `:130`), `whereNot` (`:774`,
  Rails `WhereChain#not`), `whereAssociated` (`:629`, Rails `:88`),
  `whereMissing` (`:660`, Rails `:105`)
- `or` (`:856`), `and` (`:867`), `invertWhere` (`:1200`)
- `order` (`:976`), `reorder` (`:1101`), `reverseOrder` (`:1113`), `inOrderOf`
  (76 lines, `:1124`)
- `limit` (`:988`), `offset` (`:997`)
- `select` (`:1011`), `reselect` (`:1033`), `distinct` (`:1044`)
- `group` (`:1065`), `having` (`:1076`), `regroup` (`:1091`)
- `none` (`:1262`), `lock` (`:1271`), `readonly` (`:1280`), `strictLoading`
  (`:1325`)
- `annotate` (`:1334`), `optimizerHints` (`:1344`)
- `from` (`:1366`), `createWith` (`:1375`), `unscope` (`:1384`), `extending`
  (`:1414`)
- `joins` (`:1455`), `leftJoins` (`:1485`), `leftOuterJoins` (`:1495`)
- `includes` (`:1951`), `preload` (`:1961`), `eagerLoad` (`:1971`)
- `with` (`:5708`), `withRecursive` (`:5731`), `references` (`:5750`)
- `checkIfMethodHasArgumentsBang` (`:5574`), `arelColumns` (`:5598`),
  `arelColumnsFromHash` (`:5588`), `assertModifiableBang` (`:5564`)

Two additional trails-only members ride along and belong in the same file if
they survive at all: `whereAny` (`:877`) and `whereAll` (`:899`) — neither has
a Ruby counterpart; check whether they are reachable and either delete them or
tag `@noRailsEquivalent`.

Beyond fidelity, this placement blocks
`blazetrails/rails-file-structure-method-order` from doing anything useful for
`relation.ts`: the lint orders members against the Rails file's source order,
and half of `relation.ts`'s members belong to a different Rails file.

The `*_values` accessor block (`relation.ts:4090-4395`) is also
`query_methods.rb` content but is owned by the `@values` story — leave it here.

Sizing: this is far beyond a single PR's LOC ceiling. Ship it as a sequence,
splitting on the natural `query_methods.rb` groupings above (where-family /
order-family / select-group-having / flags-and-annotations / joins-and-eager /
with-and-references), and file the remaining splits as sibling stories under
this RFC rather than fanning out PRs.

## Acceptance criteria

- Each listed member lives in `packages/activerecord/src/relation/query-methods.ts`,
  mixed into `Relation` via the `include()` / `Included<>` idiom already used
  for the public surface at `relation.ts:7297`.
- Member order within `query-methods.ts` matches `query_methods.rb` source
  order — `pnpm parity:api` then `pnpm lint --fix` is clean for the file
  (the lint needs the manifest a compare run builds).
- `whereAny` / `whereAll` are resolved: deleted, folded into `where`, or tagged
  `@noRailsEquivalent` with a permanence claim.
- No behavior change; the `relation/*.test.ts` suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
