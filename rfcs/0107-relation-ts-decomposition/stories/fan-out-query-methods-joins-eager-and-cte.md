---
title: "Move the joins/eager/CTE members and shared Arel helpers into query-methods.ts"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: 6621
claim: "2026-08-16T23:40:00Z"
assignee: "make-transliterate-raise-on-non-strings"
blocked-by: null
closed-reason: null
---

## Context

Split 4 of 4 from `fan-out-query-methods-from-relation` (measured 794 lines /
70 members). Moves the **joins, eager-load, CTE and shared-Arel-helper**
members out of `relation.ts` into
`packages/activerecord/src/relation/query-methods.ts`.

| member                               | `relation.ts` | Rails `query_methods.rb`                                    |
| ------------------------------------ | ------------- | ----------------------------------------------------------- |
| `joins` (4 overloads + body, 34)     | `:1526`       | `:868` / `joins!` `:873`                                    |
| `leftOuterJoins` (18)                | `:1570`       | `:883` / `left_outer_joins!` `:889`                         |
| `_leftOuterJoins` (43)               | `:1588`       | shared `left_joins` / `left_outer_joins` callee arm, `:883` |
| `includes` (10)                      | `:2026`       | `:250` / `includes!` `:255`                                 |
| `preload` (10)                       | `:2036`       | `:322` / `preload!` `:327`                                  |
| `eagerLoad` (12)                     | `:2046`       | `:290` / `eager_load!` `:295`                               |
| `with` (23)                          | `:3950`       | `:493` / `with!` `:500`                                     |
| `withRecursive` (19)                 | `:3973`       | `with_recursive` `:518` / `with_recursive!` `:524`          |
| `references` (10)                    | `:3992`       | `:355` / `references!` `:360`                               |
| `extractAssociated` (10)             | `:4002`       | `extract_associated` `:341`                                 |
| `arel` (9)                           | `:4261`       | `:1651` region                                              |
| `all` (10)                           | `:4385`       | `Querying#all` — verify counterpart before moving           |
| `isNone` (24)                        | `:4352`       | `none?` — verify: `relation.rb:378` may own this            |
| `assertModifiableBang` (10)          | `:3853`       | `assert_modifiable!` `:1746`                                |
| `checkIfMethodHasArgumentsBang` (14) | `:3863`       | `check_if_method_has_arguments!` `:2213`                    |
| `arelColumns` (8)                    | `:3887`       | `arel_columns` `:1662`                                      |
| `arelColumnsFromHash` (10)           | `:3877`       | `arel_columns` hash arm, `:1662`                            |

~276 lines moved — the largest of the four splits, still comfortably under the
ceiling.

Three rows above are marked "verify": `all`, `isNone` and `arel` may credit to
`relation.rb` or `querying.rb` rather than `query_methods.rb`. Read the Ruby
before moving — a wrong destination is the same fidelity miss this RFC exists
to fix. If one belongs in `relation.ts`, leave it there and note it in the PR.

`_leftOuterJoins` (43 lines) is trails' shared implementation behind
`leftJoins` / `leftOuterJoins`, carrying the `__callee__` argument Rails gets
from Ruby. It has no standalone Ruby counterpart — converge it into the Rails
shape while moving, or tag it.

## Acceptance criteria

- Every member with a confirmed `query_methods.rb` counterpart lives in
  `relation/query-methods.ts`, mixed in via `include()` / `Included<>`.
- `all`, `isNone` and `arel` are resolved against the Ruby and land in the file
  whose Rails counterpart defines them (which may be `relation.ts`).
- `_leftOuterJoins` is converged or tagged `@noRailsEquivalent`, not moved as-is
  without a decision.
- Member order matches `query_methods.rb` source order; `pnpm parity:api` then
  `pnpm lint --fix` clean for the file.
- No behavior change; `relation/with.test.ts`,
  `relation/build-joins-from-subquery-dedup.test.ts`,
  `relation/build-arel-helpers.test.ts` and the `relation/` suites pass
  unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
