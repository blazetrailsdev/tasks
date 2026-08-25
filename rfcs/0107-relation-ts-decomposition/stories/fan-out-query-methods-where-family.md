---
title: "Move the where/or/and/excluding family into query-methods.ts"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: 6677
claim: "2026-08-17T23:22:08Z"
assignee: "fan-out-query-methods-where-family"
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

## Also in scope: the flattened WhereChain trio

Found by the 2026-08-16 gap sweep — three where-family members that no story
covered. All three are real Rails features carried under a **name Rails does
not have**, which is why `pnpm parity:api:extra` scores each as novel surface
on `relation.ts`.

Rails puts all three on `WhereChain`, reached as `where.not(...)` /
`where.associated(...)` / `where.missing(...)`:

| Rails                   | vendored `query_methods.rb` | trails flattened host                                              |
| ----------------------- | --------------------------- | ------------------------------------------------------------------ |
| `WhereChain#not`        | `:49`                       | `Relation#whereNot`, `relation.ts:880-962` (80 lines, 3 overloads) |
| `WhereChain#associated` | `:88`                       | `Relation#whereAssociated`, `relation.ts:735` (31 lines)           |
| `WhereChain#missing`    | `:124`                      | `Relation#whereMissing`, `relation.ts:766` (22 lines)              |

trails **already has a faithful `WhereChain`** at
`packages/activerecord/src/relation/query-methods.ts:51`, ported from those
exact Rails lines — including the `scopeAssociationReflection` fail-fast that
mirrors `query_methods.rb:90`. But the direction is inverted: `WhereChain#not`
/ `#associated` / `#missing` are thin wrappers that delegate _outward_ to
`this._scope.whereNot(...)` / `.whereAssociated(...)` / `.whereMissing(...)`
(`query-methods.ts:59-85`), where the real bodies live. In Rails the bodies are
in `WhereChain` and `Relation` has no such methods at all.

The convergence is to invert that: move the bodies into the `WhereChain`
methods at the Rails names, and retire the flattened trio from `Relation`'s
public surface. `WhereChainScope<R>` (`query-methods.ts:36-43`) exists only to
type the outward delegation and goes with them.

Known callers to update:

- `relation.ts:517` and `relation/merged-join-alias-tracker.ts:36` — comments
  referencing `whereAssociated`; update the prose to the Rails spelling.
- `scripts/parity/pipeline/fixtures/ar-36/query.ts` and `ar-37/query.ts` — the
  TS halves spell `Book.all().whereMissing("author")` /
  `.whereAssociated("author")` while their `query.rb` counterparts already
  spell `Book.where.missing(:author)` / `.associated(:author)`. Converging the
  TS side makes the fixture pair match, which is the point of the fixture.

Do **not** delete the feature — an earlier note on this story claimed these were
absent from vendored Rails; that was a bad grep (`where_associated` finds
nothing because Rails never spells it that way) and the claim is withdrawn.

These add ~133 lines to this story's ~163, for ~296 moved lines total.
