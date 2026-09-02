---
title: "Drop the invented perform prefix from relation/finder-methods.ts so the 25 finders Relation mixes in credit to the file that ports them"
status: ready
updated: 2026-09-02
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`relation/finder-methods.ts` ports `ActiveRecord::FinderMethods`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb`), and
`Relation` mixes it in, so the Ruby extractor flattens every finder onto
`relation.rb` and `mixinMethodCreditedToOwnFile` (`compare.ts:2349-2366`) is
supposed to credit each one back to the mixin's own TS file.

It cannot, because the exported functions carry an invented `perform` prefix
and the Rails name survives only as an object-literal key:

```ts
export const FinderMethods = {
  find: performFind,
  findBy: performFindBy,
  take: performTake,
  …
};
```

(`packages/activerecord/src/relation/finder-methods.ts:634-660`; the functions
themselves are `async function performFind` at `:242`, `performFindBy` `:284`,
`performFindByBang` `:301`, `performFindSoleBy` `:314`,
`performFindOrCreateByBang` `:494`, and the rest of the `performFirst` …
`performFortyTwoBang` family.)

The credit arm looks for `find` in that file, finds `performFind`, and reports
a miss on `relation.rb`. **The counter-example is in the same file**: `exists`,
`include` and `member` are exported under their Rails names and all three
credit today, as moves, with no tooling change. That is the proof the rename is
the whole fix.

It is also a fidelity defect on its own terms — CLAUDE.md's "Names" rule and
CONTRIBUTING.md's "correct behavior under a name Rails doesn't have is also a
defect". `docs/ruby-ts-conventions.md` produces `find`, `findBy`, `findByBang`,
`take`, `takeBang`, `sole`, `findSoleBy`, `firstBang`, `lastBang`, `second` …
`fortyTwoBang`, `secondToLast`, `thirdToLast` and their bang forms,
`findOrCreateByBang`, `createOrFindByBang` — 25 names.

The `perform*` names are also novel surface in RFC 0130's population, so this
lowers `parity:api:extra` for activerecord as a side effect.

Scoped to `relation/finder-methods.ts` alone; `relation/spawn-methods.ts` and
`relation/calculations.ts` carry the same prefix and are a sibling story, so
the two do not overlap files.

## Acceptance criteria

- Every `perform*` export in `relation/finder-methods.ts` is renamed to the
  name `docs/ruby-ts-conventions.md` produces from its Ruby counterpart, and
  the `FinderMethods` map's keys become shorthand. Internal helpers that
  genuinely have no Rails counterpart (`findWithIds`, `findNth`, …) are not
  touched.
- All 25 finder names on `relation.rb` are credited — as moves to
  `relation/finder-methods.ts`, the same way `exists` / `include` / `member`
  already are.
- activerecord `relation.rb` rises by 25; package total ≥ **6185/6362** if this
  lands alone.
- `pnpm parity:api:extra --package activerecord` reports at least 25 fewer
  novel names, and `extra-surface-mark.json` is lowered with
  `parity:api:extra:tighten`, never raised.
- `pnpm parity:api:calls`, `:calls:args` and `:params` are clean; no new
  baseline row. A pure rename must not need one.

## Definition of done

A baseline row, an `arity-exclude.json` entry, or a raised extra-surface mark does not close this story. A pure rename that needs one has changed something it should not have.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:extra --package activerecord
pnpm parity:api:extra:gate
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
```

A pure rename must leave all three ratchets green with no new baseline row. If
`parity:api:extra:gate` goes red because the mark now sits above the
measurement, lower it with `pnpm parity:api:extra:tighten` — never raise it.
