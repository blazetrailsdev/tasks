---
title: "Move the where/or/and/excluding family into query-methods.ts"
status: ready
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split 1 of 4 from `fan-out-query-methods-from-relation`, which measured **794
lines across 70 members** against its 600-LOC estimate — over the ceiling, and
its own body already conceded it needed splitting. The four splits follow
`query_methods.rb` source order and are non-overlapping.

This split moves the **where family** out of `relation.ts` into
`packages/activerecord/src/relation/query-methods.ts`, whose Rails counterpart
`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb` defines
them:

| member                                 | `relation.ts` | Rails `query_methods.rb`           |
| -------------------------------------- | ------------- | ---------------------------------- |
| `where` (5 overloads + body, 85 lines) | `:621-707`    | `:1033` / `where!` `:1043`         |
| `rewhere` (27 lines)                   | `:708`        | `:1061`                            |
| `or` (11 lines)                        | `:960`        | `:1167` / `or!` `:1179`            |
| `and` (10 lines)                       | `:971`        | `:1135` / `and!` `:1143`           |
| `excluding` (11 lines)                 | `:1017`       | `:1574` / `excluding!` `:1587`     |
| `invertWhere` (9 lines)                | `:1303`       | `:1101` / `invert_where!` `:1105`  |
| `structurallyCompatible` (10 lines)    | `:2349`       | `structurally_compatible?` `:1121` |

~163 lines moved.

Two trails-only siblings sit in the same region and must be resolved here
rather than moved blind: `whereAny` (`relation.ts:981`) and `whereAll` — neither
has a Ruby counterpart. Check reachability and either delete, fold into `where`,
or tag `@noRailsEquivalent` with a permanence claim.

`_excludingArgs` (`relation.ts:1044`, 37 lines) is `excluding`'s invented
argument-splitter and is owned by the where-family-privates gap story — leave it
in place here.

## Acceptance criteria

- Every member in the table lives in `relation/query-methods.ts`, mixed into
  `Relation` via the `include()` / `Included<>` idiom the file already uses.
- Member order within `query-methods.ts` matches `query_methods.rb` source
  order — `pnpm parity:api` then `pnpm lint --fix` clean for the file (the lint
  needs the manifest a compare run builds).
- `whereAny` / `whereAll` resolved: deleted, folded, or tagged.
- No behavior change; `relation/where.test.ts`, `relation/where-chain.test.ts`,
  `relation/or.test.ts`, `relation/composite-where.test.ts`,
  `relation/merging.test.ts` pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
