---
title: "parity: an @inventedArm receipt speaks for every arm of its token, not a counted number"
status: draft
updated: 2026-10-04
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Trails PR 8465 added the `@inventedArm <token> — PERMANENT|CONVERGEABLE <story-id>` receipt
(`scripts/api-compare/invented-arm-tags.ts`). A receipt is per TOKEN: `staleArmReceipts`
(`scripts/api-compare/report-arms.ts`) holds an `if` receipt live while the pair files any
invented `if`, and `compareArms` drops every invented `if` on the pair. `defineCall`
(`packages/activemodel/src/attribute-methods.ts`) invents three `if` arms against
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:410-428` under one
receipt, so converging two of them leaves the receipt live, and a fourth invented `if` added
later is discharged without review.

The tag plumbing dedups at three points: `suppressedNamesIn`
(`missing-rails-name-tags.ts`), `recordTaggedCalls` (`compare.ts`, a `Map` keyed by token),
and the `[...armTags.keys()]` written onto the skeleton row.

## Acceptance criteria

- [ ] A receipt states how many arms of its token it speaks for (repeated tags, or a count),
      and the count reaches the skeleton row.
- [ ] `compareArms` drops at most that many invented arms; `staleArmReceipts` reds when the
      pair invents fewer.
- [ ] `defineCall`'s receipts name its three `if` arms; CLAUDE.md's per-token paragraph is
      rewritten.
- [ ] A scripts test covers one receipt too many and one too few.

## Verification

```bash
pnpm vitest run scripts/api-compare/invented-arm-tags.test.ts && pnpm parity:api:arms:throws
```
