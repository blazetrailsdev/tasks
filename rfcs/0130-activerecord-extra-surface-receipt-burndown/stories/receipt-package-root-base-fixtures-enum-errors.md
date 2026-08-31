---
title: "Package root: resolve the remaining 126 novel names across base.ts, index.ts, fixtures.ts, enum.ts and errors.ts"
status: draft
updated: 2026-08-31
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: ["credit-define-model-callbacks-in-the-ruby-extractor"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**126 novel names across 50 files** at the package root — the long tail, and the
last area before enrollment. Depends on
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
- `pnpm parity:api:extra --package activerecord --novel-only` reports
  `totalNovel: 0` for the whole package; the mark is tightened in the same PR
  and now reads `novel: 0`.
