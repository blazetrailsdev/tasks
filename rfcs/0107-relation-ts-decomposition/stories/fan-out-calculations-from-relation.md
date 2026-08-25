---
title: "Move ids/pluck/pick and the async readers into relation/calculations.ts"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["retire-relation-private-thunk-block"]
deps-rfc: []
est-loc: 350
priority: null
pr: 6597
claim: "2026-08-16T13:45:03Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

192 lines / 10 members of `relation.ts` implement
`vendor/rails/activerecord/lib/active_record/relation/calculations.rb`.
`packages/activerecord/src/relation/calculations.ts` already exists (1,211
lines) and is where they belong.

- `ids` (88 lines, `relation.ts:3613`) — Rails `calculations.rb:270`. 88 lines
  against Rails' ~20; diff the CPK and `pluck`-delegation arms while moving.
- `pluck` (`relation.ts:3452`) plus `_pluckInner` (153 lines, `:3460`) — Rails
  `calculations.rb:220`. `_pluckInner` is an invented split of one Ruby method
  into two, which CLAUDE.md's "Decomposition" rule forbids; fold it back.
- `pick` (41 lines, `relation.ts:2817`) — Rails `calculations.rb:296`
- The `async*` readers (`relation.ts:3401-3443`): `asyncCount`, `asyncSum`,
  `asyncMinimum`, `asyncMaximum`, `asyncAverage`, `asyncPluck`, `asyncIds`,
  `asyncPick` (`:6036`) — Rails generates these from
  `calculations.rb:16` (`Relation::VALUE_METHODS`-adjacent `async_` prefixing
  over the `ActiveRecord::Calculations` methods).

`relation/calculations.ts` currently reaches back into `relation.ts` for
`_applyJoinsToManager` (declared on its host interface at
`relation/calculations.ts:177`) — that coupling is retired by the
`JoinDependency` story; sequence after it or leave the declaration in place.

## Acceptance criteria

- `ids`, `pluck`, `pick` and the `async*` readers live in
  `packages/activerecord/src/relation/calculations.ts`.
- `_pluckInner` is folded back into `pluck`: one Rails method is one TS method.
- `ids`' control flow matches `calculations.rb:270` — same branches, same
  order.
- The `async*` readers are generated from one list rather than hand-written,
  mirroring `calculations.rb:16`.
- Member order matches `calculations.rb` source order.
- No behavior change; the calculations and `relation/` suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean — note
  `call-mismatches-exclude/activerecord/relation/calculations.json` has 27 rows
  today; do not add to it.
