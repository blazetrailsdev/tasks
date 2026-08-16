---
title: "Move the flag/annotation/scope-shaping members into query-methods.ts"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6616
claim: "2026-08-16T22:53:03Z"
assignee: "converge-relation-select-and-join-residue"
blocked-by: null
closed-reason: null
---

## Context

Split 3 of 4 from `fan-out-query-methods-from-relation` (measured 794 lines /
70 members). Moves the **flag, annotation and scope-shaping** members out of
`relation.ts` into `packages/activerecord/src/relation/query-methods.ts`.

| member                               | `relation.ts` | Rails `query_methods.rb`                       |
| ------------------------------------ | ------------- | ---------------------------------------------- |
| `none` (9)                           | `:1365`       | `:1281` / `none!` `:1285`                      |
| `lock` (9)                           | `:1374`       | `:1238` / `lock!` `:1242`                      |
| `lockValue` (9)                      | `:1410`       | `VALUE_METHODS` reader, `:162`                 |
| `readonly` (9)                       | `:1383`       | `:1309` / `readonly!` `:1313`                  |
| `isReadonly` (9)                     | `:1392`       | `readonly_value`, `:162`                       |
| `strictLoading` (9)                  | `:1428`       | `:1324` / `strict_loading!` `:1328`            |
| `isStrictLoading` (9)                | `:1419`       | `strict_loading_value`, `:162`                 |
| `annotate` (10)                      | `:1437`       | `:1529` / `annotate!` `:1535`                  |
| `optimizerHints` (11)                | `:1447`       | `:1485` / `optimizer_hints!` `:1490`           |
| `from` (9)                           | `:1469`       | `:1391` / `from!` `:1395`                      |
| `createWith` (9)                     | `:1478`       | `create_with` `:1346` / `create_with!` `:1350` |
| `unscope` (11)                       | `:1487`       | `:806` / `unscope!` `:811`                     |
| `extending` (5 overloads + body, 28) | `:1498`       | `:1456` / `extending!` `:1464`                 |
| `skipPreloadingValue` (4)            | `:4413`       | `VALUE_METHODS` reader, `:162`                 |

~145 lines moved.

`isReadonly` / `isStrictLoading` / `lockValue` / `skipPreloadingValue` are the
`VALUE_METHODS`-generated readers (`query_methods.rb:162-183`). The
`restore-relation-values-hash` story landed the `@values` map, so these should
now be generated from that list rather than hand-written — if any still is,
fold it into the generator rather than moving the hand-written body.

## Acceptance criteria

- Every member in the table lives in `relation/query-methods.ts`, mixed in via
  `include()` / `Included<>`.
- The four `VALUE_METHODS` readers are generated from the `VALUE_METHODS` list
  landed by `restore-relation-values-hash`, not hand-written.
- Member order matches `query_methods.rb` source order; `pnpm parity:api` then
  `pnpm lint --fix` clean for the file.
- No behavior change; the `relation/` suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
