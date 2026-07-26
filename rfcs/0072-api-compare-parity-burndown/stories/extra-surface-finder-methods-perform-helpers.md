---
title: "extra-surface: classify relation/finder-methods perform* async-split helpers"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-honor-internal-jsdoc-on-file-functions"]
deps-rfc: []
est-loc: 120
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). `packages/activerecord/src/relation/finder-methods.ts` is the
**highest-purity drift file in activerecord: 30 novel extras and 0 moved**
(`pnpm api:extra --package activerecord`). Every one of the 30 is a trails
naming invention, not a Rails port with a wrong home — nothing named
`perform_first` or `raise_not_found_all` exists anywhere in
`vendor/rails/activerecord/`.

Full list (28 `perform*` + 2 helpers):

`normalizeFindArgs` (`finder-methods.ts:82`), `raiseNotFoundAll` (`:192`),
`raiseNotFoundSingle` (`:248`), `performFind` (`:311`), `performSole`
(`:504`), `performTake` (`:519`), plus `performCreateOrFindByBang`,
`performFifth`, `performFifthBang`, `performFindBy`, `performFindByBang`,
`performFindOrCreateByBang`, `performFindSoleBy`, `performFirst`,
`performFirstBang`, `performFortyTwo`, `performFortyTwoBang`,
`performFourth`, `performFourthBang`, `performLast`, `performLastBang`,
`performSecond`, `performSecondBang`, `performSecondToLast`,
`performSecondToLastBang`, `performTakeBang`, `performThird`,
`performThirdBang`, `performThirdToLast`, `performThirdToLastBang`.

These are the async-split implementations behind the public finder surface —
`performFirst` at `finder-methods.ts:429` is what `Relation#first` resolves
to, and `performFirstBang` (`:444`) calls `performFirst.call(this)`. The
public names (`first`, `firstBang`, `take`, `sole`, …) are already matched
against `relation/finder_methods.rb`; the `perform*` layer is the extra.

`raiseNotFoundAll` / `raiseNotFoundSingle` correspond to Rails'
`raise_record_not_found_exception!`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb`) —
one Rails method that trails split in two; those two may be relocatable to
the Rails name rather than hidden.

Every one of these is an implementation detail with no external caller
outside the package, so the right disposition is almost certainly (b)
allowlist-with-reason via the `@internal` convention documented in
CONTRIBUTING.md — but the classification must be made per name, not blanket.
Note the `@internal` tag does not currently suppress top-level exported
functions (see the extra-surface `@internal`-on-fileFunctions story); this
story should land after that fix, or verify the suppression works before
relying on it.

## Acceptance criteria

- Each of the 30 names classified and dispositioned, with the reason recorded
  at the call site (per the repo's justify-deviations-at-the-call-site rule),
  not only in the PR body:
  - `@internal` JSDoc where the name is a private async-split helper;
  - renamed/merged toward the Rails name where a Rails counterpart exists
    (check `raiseNotFoundAll` / `raiseNotFoundSingle` against
    `raise_record_not_found_exception!` first);
  - `scripts/api-compare/extra-surface-allow.json` entry with a written
    reason only where neither applies.
- No behavior change: `pnpm vitest run packages/activerecord/src/relation/finder-methods.test.ts`
  and any `*.trails.test.ts` sibling pass unchanged.
- No test renames (test names match Rails verbatim).
- `pnpm api:extra --package activerecord` reports
  `relation/finder-methods.ts` at 0 unexplained novel extras; record the
  before/after in the PR body.
