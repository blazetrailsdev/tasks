---
title: "Package root: resolve the remaining 126 novel names across base.ts, index.ts, fixtures.ts, enum.ts and errors.ts"
status: done
updated: 2026-09-11
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps:
  [
    "credit-define-model-callbacks-in-the-ruby-extractor",
    "refresh-stale-phase-inventories-before-claim",
  ]
deps-rfc: []
est-loc: 450
priority: 3
pr: trails#7714
claim: "2026-09-11T18:31:02Z"
assignee: "receipt-package-root-base-fixtures-enum-errors"
blocked-by: null
closed-reason: null
---

## Context

**96 novel names across 43 files** outside `connection-adapters/` — the long
tail, and the last area before enrollment. Re-measured 2026-09-11 with
`pnpm parity:api:extra --package activerecord --novel-only` (package total 140:
these 96, plus 44 in `connection-adapters/`, owned by
`receipt-connection-adapters-matched-files`); the 2026-08-30 census said 126
across 50. The per-file figures below are that 2026-09-11 snapshot, not a
target — re-measure at claim time. Depends on
`credit-define-model-callbacks-in-the-ruby-extractor`, which removes 16 of them
from `base.ts` and its neighbours without a tag being written.

- `base.ts` — 19, of which the 16 callback macros are phase 2's. What remains is
  `adapterClassSync` (a `*Sync` twin, route 3) and two others.
- `index.ts` — 11, no Ruby counterpart: `afterAllTransactionsCommit`,
  `assignNestedAttributes`, `castEnumValue`, `currentTransactionPublic`,
  `defineEnum`, `escapeComment`, `generateModels`, `getDelegatedTypeConfig`,
  `isDestroyable`, `readEnumValue`, and one more. This is the package barrel;
  every one of these is also defined in a real file, so the right move is almost
  certainly to stop re-exporting them publicly rather than to tag the barrel
  (and tagging a re-export is the stale-tag trap phase 5 also hits).
- `fixtures.ts` — 9 matched against `fixtures.rb`: `clearTableRegistry`,
  `defineFixtures`, `defineJoinTableFixtures`, `fixtureId`,
  `FixtureSetPrimaryKeyError`, `prepareJoinTableFixtures`,
  `prepareModelFixtures`, `throughJoinTableNames`, `throughLabelAssociations`.
  RFC 0059's canonical-fixtures work is adjacent; check it before receipting.
- `association-cache.ts` — 6, no counterpart, including `[Symbol.iterator]` and
  `[Symbol.toStringTag]` (JS protocol members, `PERMANENT`).
- `enum.ts` — 5 (`castEnumValue`, `defineEnum`, `enumMethod`, `readEnumValue`,
  `subtypeType`), duplicated into `index.ts`'s 11.
- `errors.ts` — 5: `AssociationTargetReplacedDuringLoad`, `fkDetails`,
  `NotImplementedError`, `setConnectionPool`, `sqlTypeToMigrationKeyword`. A
  novel error CLASS is a fidelity problem, not a surface problem — CLAUDE.md
  requires the same error class and message as Rails, so route 1 or 4.
- `connection-handling.ts` — 4, `tasks/database-tasks.ts` — 4, then a tail of
  ~44 files at 1–3 each.

Expect this to exceed the LOC ceiling. Split it — `base.ts` + `index.ts` +
`enum.ts` as one PR (they share the barrel duplication), the rest as a sibling —
and file the split as a story rather than fanning out unfiled.

## Acceptance criteria

- All remaining root names resolved by one of the four routes, stated per file.
- `index.ts` stops publicly re-exporting names that are extra surface at their
  definition, rather than carrying receipts for them.
- No novel error class survives in `errors.ts` without a Rails counterpart or a
  `CONVERGEABLE` receipt naming the story that will remove it.
- Every file outside `connection-adapters/` reports 0 novel under
  `pnpm parity:api:extra --package activerecord --novel-only`, and the mark is
  tightened in the same PR. The census counts above are a snapshot; the
  invariant is the 0, not a number resolved.
