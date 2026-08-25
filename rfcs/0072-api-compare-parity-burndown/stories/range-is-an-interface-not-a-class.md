---
title: "trails' Range is a data interface, so every Range method is a free function and every is_a?(::Range) is re-derived"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6219
claim: "2026-08-08T02:39:55Z"
assignee: "converge-message-encryptor-sign-through-message-verifier"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Range#as_json` in PR #6214.

Ruby's `Range` is a core class Rails reopens in eight files
(`activesupport/lib/active_support/core_ext/range/*.rb`, plus
`core_ext/object/json.rb:157-161`). trails carries it as a bare data triple
instead — `packages/activesupport/src/range-ext.ts:23`:

```ts
export interface Range<T> {
  begin: T | null;
  end: T | null;
  excludeEnd: boolean;
}
```

so every ported `Range` method is a free function taking the receiver as its
first parameter, and every Ruby `Range === value` / `is_a?(::Range)` test has to
be re-derived structurally. PR #6214 consolidated the second-worst instance —
`overlap.ts` had a private `isRange` that accepted any non-`Date` object where
`overlap.rb:9` spells `is_a?(::Range)` — into one exported `isRange()` in
`range-ext.ts`, but that predicate is itself `@noRailsEquivalent PERMANENT`
surface standing in for a class test the language could actually express.

The knock-on costs, all live in the tree right now:

- `range-ext.ts` carries 3 novel names (`makeRange`, `rangeIncludesValue`,
  `rangeIncludesStringValue`) that a real class would fold into `new Range()`,
  `#cover?` and `#include?`.
- `core-ext/range/conversions.ts`'s `toS` had to be exported and tagged
  `@noRailsEquivalent PERMANENT` so `Range#as_json` could reach `Range#to_s`;
  core Ruby's `Range#to_s` has no Rails file to live in, but it does have a
  class.
- `core-ext/object/json.ts`'s `isPlainObject` — the stand-in for Ruby's
  `Hash === value` — needs an explicit `isRange` exclusion, because a range
  is a plain object here and would otherwise be encoded as an attribute bag
  before `Range#as_json` could be reached.
- `validations/clusivity.ts:177` and `validations.ts:420` both already carry
  comments noting the absence of a `Range` class.

## Converged shape

A first-class `Range<T>` class in `packages/activesupport/src/range-ext.ts`
with the core Ruby readers Rails' reopenings assume — `begin`, `end`,
`excludeEnd`/`exclude_end?`, `to_s`, `cover?`, `include?` — and the
`core-ext/range/*.ts` files reopening it via the settled mixin idiom
(`this`-typed functions assigned to the class, or `include()` / `Included<>`
from `@blazetrails/activesupport`) rather than taking the receiver as a
parameter. `isRange()` then collapses to `value instanceof Range`, and both
`@noRailsEquivalent PERMANENT` tags (`isRange`, `toS`) plus `isPlainObject`'s
range exclusion are deleted rather than rehomed.

Keep `makeRange()` as a deprecated shim only if the caller count forces a
staged migration; the endgame is `new Range(1, 2)`.

## Acceptance criteria

- [ ] `Range` is a class, not an interface; `core-ext/range/*.ts` methods are
      reopenings of it, not free functions taking the receiver.
- [ ] `isRange()` and `conversions.ts`'s exported `toS` are deleted, along with
      their `@noRailsEquivalent` tags.
- [ ] `core-ext/object/json.ts`'s `isPlainObject` no longer special-cases a
      range; the dispatcher's Range arm is an `instanceof`.
- [ ] `validations/clusivity.ts:177` and `validations.ts:420` lose the comments
      noting the class's absence.
- [ ] `pnpm parity:api:extra --package activesupport` novel count strictly drops;
      `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
