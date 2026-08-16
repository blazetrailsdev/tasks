---
title: "Move the finder_methods.rb members out of relation.ts into finder-methods.ts"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["retire-relation-private-thunk-block"]
deps-rfc: []
est-loc: 350
priority: null
pr: 6605
claim: "2026-08-16T18:52:31Z"
assignee: "converge-execute-grouped-calculation-body-to-rails-source-order"
blocked-by: null
closed-reason: null
---

## Context

258 lines / 41 members of `relation.ts` implement
`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb`.
`packages/activerecord/src/relation/finder-methods.ts` already exists (997
lines) and is where they belong.

The substantive parked bodies:

- `exists` (73 lines, `relation.ts:3328`) — Rails `finder_methods.rb:315`
- `applyJoinDependency` (58 lines, `relation.ts:4738`) — Rails
  `finder_methods.rb:462`. **Owned by the `apply_join_dependency` story**;
  leave it out of this one.
- `include` (32 lines, `relation.ts:6185`) and `member` (`:6217`) — Rails
  `finder_methods.rb:376` `include?` / `member?`
- `usingLimitableReflections` (`relation.ts:4822`) — Rails
  `finder_methods.rb:485`
- `raiseRecordNotFoundExceptionBang` (`relation.ts:7364`, interface decl)

The remaining ~30 members are one-line thunks
(`findOne`, `findSome`, `findSomeOrdered`, `findTake`, `findTakeWithLimit`,
`findNth`, `findNthWithLimit`, `findNthFromLast`, `findLast`,
`orderedRelation`, `_orderColumns`, `constructRelationForExists`,
`findWithIds`) plus the declaration-merge block at `relation.ts:7324` — those
are retired by the thunk-block story, not this one.

Do this story **after** the thunk-block story, so the members move into a file
that already owns the mixin wiring.

## Acceptance criteria

- `exists`, `include`, `member`, `usingLimitableReflections` and
  `raiseRecordNotFoundExceptionBang` live in
  `packages/activerecord/src/relation/finder-methods.ts`.
- `exists`' control flow is verified against `finder_methods.rb:315-360` —
  same branches, same order (the `Relation`/`Array`/`Hash`/`false`/`nil` arms).
- Member order matches `finder_methods.rb` source order.
- No behavior change; `relation/finder-methods.test.ts` and the `relation/`
  suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
