---
title: "associations/: resolve 29 novel names across join-dependency, the scope slots and the through-reflection validators"
status: in-progress
updated: 2026-09-05
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 220
priority: 2
pr: 7516
claim: "2026-09-05T11:07:02Z"
assignee: "receipt-associations-and-join-dependency"
blocked-by: null
closed-reason: null
---

## Context

**29 novel names across 10 files** under `associations/`.

- `associations/join-dependency/join-part.ts` — 6, MATCHED against
  `associations/join_dependency/join_part.rb`: `assocName`, `assocType`,
  `effectiveSqlName`, `immediateAssocName`, `parentPath`, `tableIndex`. Rails'
  `JoinPart` carries `#base_klass`, `#children`, `#table`, `#extract_record`,
  `#instantiate` and little else — six trails-only readers on a matched class is
  the shape of an invented parallel API, so try route 1 first.
- `associations/_scope-slots.ts` — 4, no counterpart:
  `getAssociationRelationFactory`, `getDjasScopeBuilder`,
  `setAssociationRelationFactory`, `setDjasScopeBuilder`. This is a
  zero-import slot module, which CLAUDE.md ratifies repo-wide under
  "Call-time constant resolution (Ruby autoload → the zero-import slot)".
  `PERMANENT`, citing that section — do NOT re-derive the justification here,
  and note the section lists three sanctioned slots that do not include this
  one, so reconcile that list in the same PR.
- `associations/join-dependency.ts` — 4, matched: `columnsForNode`,
  `instantiateFromRows`, `nodes`, `selectArel`.
- `associations/validate-through-reflection.ts` — 4, no counterpart. Rails
  validates through-reflections inside `ThroughReflection#check_validity!`
  (`reflection.rb`), so this is a Rails method extracted into a trails file —
  route 1, fold it back to the Rails home.
- `associations/errors.ts` — 3 matched error classes, `associations/collection-association.ts`
  — 2 (`syncIdsWrite`, `syncWrite`, the `*Sync` family again),
  `associations/instance-methods.ts` — 2, `associations/new-owner-seed-rebase.ts`
  — 2, plus 2 files at 1.

`_scope-slots.ts`'s leading underscore is worth checking: `extra-surface.ts`
filters `_`-prefixed NAMES from the measured surface, not `_`-prefixed files,
which is why these four still score.

## Acceptance criteria

- All 29 resolved by one of the four routes, stated per file.
- The `_scope-slots.ts` receipt is `PERMANENT` citing CLAUDE.md's
  call-time-constant-resolution section, and that section's enumerated list of
  sanctioned slots is corrected to include it (or the slot is shown to be
  unnecessary and deleted).
- `associations/` reports 0 novel; the mark is tightened in the same PR.
- The association suites stay green on all three adapter lanes, and
  `pnpm parity:api:calls` shows no new rows.
