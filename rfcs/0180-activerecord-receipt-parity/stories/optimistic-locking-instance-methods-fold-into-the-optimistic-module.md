---
title: "activerecord: Locking::Optimistic's instance methods fold into the Optimistic module (extractor keeps a merged interface member's seat)"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`Locking::Optimistic` is one Concern: its `included do` block, its instance methods and its
`ClassMethods` (`vendor/rails/v8.0.2/activerecord/lib/active_record/locking/optimistic.rb:52-66,134-147,154`).
`ActiveRecord::Base` includes it once (`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:311`).

`packages/activerecord/src/locking/optimistic.ts` splits the module in two. `Optimistic` holds only the
`[included]` hook, and a second export carries the instance methods:

```ts
export const InstanceMethods = {
  lockingEnabled,
  incrementBang,
  _lockValueForDatabase,
  _clearLockingColumn,
};
```

`packages/activerecord/src/base.ts` includes both, `Optimistic` early and `InstanceMethods` after
`Persistence`. Rails has no `Locking::Optimistic::InstanceMethods`, so the export is `@noRailsEquivalent`.

The audit converged the twin in `locking/pessimistic.ts` (`export const Pessimistic = { lockBang, withLock }`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/locking/pessimistic.rb`). The same fold here was tried
and reverted, with the measured blocker:

- Folding the four members into `Optimistic` and including it once, after `Persistence` (so
  `Optimistic#increment!` still wins over `Persistence#increment!`, as `base.rb:300,311` orders them),
  typechecks (the locking tests were not run against it).
- `pnpm parity:api` then drops `locking/optimistic.rb` from 26/26 to 24/26: `lock_optimistically` and
  `lock_optimistically?` go unmatched. They are credited through
  `export interface Optimistic { readonly lockOptimistically: boolean }`, which declaration-merges with
  the const. Once the const has harvestable members the extractor marks the whole merged module
  `objectLiteral` (`scripts/api-compare/extract-ts-api.ts`, the `prior.objectLiteral = true` arm), and
  `compare.ts` (`addMethods`) reads every non-static member of an object-literal module as stating no
  seat, the interface's members included.

The same bundle is `@noRailsEquivalent PERMANENT` in `timestamp.ts`, `normalization.ts`,
`persistence.ts`, `touch-later.ts`, `model-schema.ts` and `nested-attributes.ts`, listed by the root
audits; `attribute-methods/query.ts` (`Query`) is the settled single-module shape.

## Acceptance criteria

- [ ] An interface member of a module that declaration-merges an interface with an object literal keeps its seat: the object-literal no-seat rule applies per member harvested from the literal, not to the merged module, with an extractor/comparator unit test.
- [ ] `Optimistic` carries `lockingEnabled`, `incrementBang`, `_lockValueForDatabase` and `_clearLockingColumn` beside its `[included]` hook; `InstanceMethods` and its receipt are deleted; `base.ts` includes `Locking::Optimistic` once, after `Persistence` and before `Locking::Pessimistic`.
- [ ] `locking/optimistic.rb` stays 26/26 in `pnpm parity:api`, and `pnpm parity:api:extra:gate` stays rowless.

## Verification

```bash
pnpm vitest run packages/activerecord/src/locking.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
