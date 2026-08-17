---
title: "Move the order/limit/offset and select/group/having families into query-methods.ts"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6629
claim: "2026-08-17T02:42:54Z"
assignee: "converge-hwia-delete-returns-the-removed-value"
blocked-by: null
closed-reason: null
---

## Context

Split 2 of 4 from `fan-out-query-methods-from-relation` (measured 794 lines /
70 members). Moves the **ordering and projection families** out of
`relation.ts` into `packages/activerecord/src/relation/query-methods.ts`.

| member                            | `relation.ts` | Rails `query_methods.rb`           |
| --------------------------------- | ------------- | ---------------------------------- |
| `order` (12)                      | `:1081`       | `:656` / `order!` `:664`           |
| `limit` (9)                       | `:1093`       | `:1211` / `limit!` `:1215`         |
| `offset` (14)                     | `:1102`       | `:1227` / `offset!` `:1231`        |
| `reorder` (12)                    | `:1206`       | `:752` / `reorder!` `:760`         |
| `reverseOrder` (11)               | `:1218`       | `:1498` / `reverse_order!` `:1502` |
| `inOrderOf` (74)                  | `:1229`       | `in_order_of` `:717`               |
| `select` (3 overloads + body, 22) | `:1116`       | `:413`                             |
| `reselect` (11)                   | `:1138`       | `:541` / `reselect!` `:548`        |
| `distinct` (9)                    | `:1149`       | `:1410` / `distinct!` `:1415`      |
| `group` (11)                      | `:1170`       | `:573` / `group!` `:578`           |
| `having` (4 overloads + body, 15) | `:1181`       | `:1197` / `having!` `:1201`        |
| `regroup` (10)                    | `:1196`       | `:593` / `regroup!` `:599`         |

~210 lines moved.

`inOrderOf` at 74 lines against Rails' ~35 (`query_methods.rb:717-751`) is the
one body worth diffing rather than moving verbatim — check the `filter:` kwarg
arm and the `Arel::Nodes::Case` construction against the Ruby while it is in
your hands.

Note `select`'s block form (`select(fn)` returning `Promise<T[]>`) is Rails'
`Enumerable#select` arm, which `relation.rb` reaches through `include
Enumerable` — keep both arms, see CLAUDE.md on porting predicates and blocks.

## Acceptance criteria

- Every member in the table lives in `relation/query-methods.ts`, mixed in via
  `include()` / `Included<>`.
- Member order matches `query_methods.rb` source order; `pnpm parity:api` then
  `pnpm lint --fix` clean for the file.
- `inOrderOf`'s control flow verified line-by-line against
  `query_methods.rb:717-751` — same branches, same order, same guards.
- `select`'s block arm and column arm both survive.
- No behavior change; `relation/select.test.ts`, `relation/order.test.ts`,
  `relation/field-ordered-values.test.ts`,
  `relation/grouped-composite-assoc-applies-order.trails.test.ts` pass
  unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
