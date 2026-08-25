---
title: "Move findEach/findInBatches/inBatches into relation/batches.ts"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["retire-relation-private-thunk-block"]
deps-rfc: []
est-loc: 350
priority: null
pr: 6594
claim: "2026-08-16T12:45:04Z"
assignee: "wave-2c-grouped-calculation-and-query-method-stores"
blocked-by: null
closed-reason: null
---

## Context

265 lines / 6 members of `relation.ts` implement
`vendor/rails/activerecord/lib/active_record/relation/batches.rb`.
`packages/activerecord/src/relation/batches.ts` already exists (268 lines) and
is where they belong.

- `findEach` (53 lines, `relation.ts:4498`) — Rails `batches.rb:36`
- `findInBatches` (54 lines, `relation.ts:4444`) — Rails `batches.rb:96`
- `inBatches` (148 lines, `relation.ts:4551`, plus the two overload signatures
  at `:4551`/`:4555`) — Rails `batches.rb:167`
- `actOnIgnoredOrder` (`relation.ts:7190`) — already a thunk to
  `relation/batches.ts`, retired by the thunk-block story

`inBatches` at 148 lines against Rails' ~110 also deserves a body diff while
it is being moved — check the `order`/`use_ranges`/`cursor` arms against
`batches.rb:167-280` rather than moving it verbatim.

## Acceptance criteria

- `findEach`, `findInBatches` and `inBatches` live in
  `packages/activerecord/src/relation/batches.ts`, mixed in via `include()` /
  `Included<>`.
- Member order matches `batches.rb` source order.
- `inBatches`' control flow is verified line-by-line against
  `batches.rb:167-280` — same branches, same order, same guards.
- No behavior change; the batches test files pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
