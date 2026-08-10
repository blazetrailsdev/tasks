---
title: "Publish core-ext/range's toFs/each/step under their Rails names via subpath exports"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6108
claim: "2026-08-05T00:59:03Z"
assignee: "i18n-date-valid-date-frags-weeknum-blocks"
blocked-by: null
closed-reason: null
---

## Context

PR #6101 ported `core_ext/range/conversions.rb`, `each.rb`, and `overlap.rb`
into `packages/activesupport/src/core-ext/range/*.ts`. Each file carries the
Rails method names (`toFs`, `toFormattedS`, `each`, `step`), which is what
`parity:api` matches on — but three of them cannot be re-exported from the
flat `packages/activesupport/src/index.ts` barrel under those names:

- `toFs` collides with `time-ext.ts`'s `Date#to_fs`
  (`packages/activesupport/src/time-ext.ts:503`), which the barrel already
  publishes via `export * from "./time-ext.js"`.
- `each` / `step` collide with the enumerable helpers.

So `index.ts` currently publishes them aliased:

```ts
export {
  RANGE_FORMATS,
  toFs as rangeToFs,
  toFormattedS as rangeToFormattedS,
} from "./core-ext/range/conversions.js";
export { each as rangeEach, step as rangeStep } from "./core-ext/range/each.js";
```

The public API names therefore diverge from Rails even though the declarations
do not. Rails has no such collision because these are methods on distinct
receivers (`Range#to_fs` vs `Time#to_fs`), not free functions in one namespace.

## Converged shape

Rails users reach these through
`require "active_support/core_ext/range/conversions"`, so the trails analogue
is a **subpath export** rather than a flat-barrel alias — the pattern
`packages/activesupport/package.json` already uses for `glob`, `message-verifier`,
and `digest` (see the comment at `index.ts:13`, which records exactly this
rationale for `glob`).

Add `./core-ext/range/conversions` and `./core-ext/range/each` subpath exports
and drop the four aliases from the flat barrel, so callers write:

```ts
import { toFs } from "@blazetrails/activesupport/core-ext/range/conversions";
```

Check callers first: at the time of #6101 the aliases had no production
consumers outside `packages/activesupport` itself (`rangeToFs` / `rangeEach` /
`rangeStep` were referenced only by `core-ext/range-ext.test.ts`), so the
rename should be contained.

## Acceptance criteria

- `toFs` / `toFormattedS` / `each` / `step` are reachable under their Rails
  names, not under `range*` aliases.
- No name collision with `time-ext.ts`'s `toFs` or the enumerable `each`/`step`.
- `pnpm parity:api` / `pnpm parity:api:extra --package activesupport` do not regress.
- `packages/activesupport/src/core-ext/range-ext.test.ts` still passes and is
  NOT renamed (`parity:test` maps it to `range_ext_test.rb`).
