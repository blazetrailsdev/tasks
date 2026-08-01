---
title: "await-precision-receiver-blind"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5826
claim: "2026-08-01T20:00:59Z"
assignee: "await-precision-receiver-blind"
blocked-by: null
closed-reason: null
---

## Context

`resolveAsyncNames` / `crossFileAsyncNames` in
`scripts/prism-codegen/async-source.ts:57-93` build the whole-program async
manifest by **bare method name**, receiver-blind: if any ported method named
`select` is async, every `.select(...)` call site in every target gets an
`await`, regardless of what the receiver actually is.

The golden snapshots checked in by #5815 and regenerated in #5823 make the
cost visible. Newly-awaited call sites that are plainly not DB-backed:

- `scripts/prism-codegen/__snapshots__/relation/calculations.js.snap` —
  `await this.groupValues.isAny()`, `await primary_key_array.isOne()`
- `scripts/prism-codegen/__snapshots__/core.js.snap` —
  `await id.isAny(ActiveRecord.Base)`
- `scripts/prism-codegen/__snapshots__/relation.js.snap` —
  `await entries.size() === 11`,
  `await INVALID_METHODS_FOR_DELETE_ALL.select(...)`,
  `await this.values.dup()`

These are plain arrays / native values. `await` on a non-thenable is harmless
at runtime but wrong as emitted output: it makes the enclosing method async
for no reason, which then propagates outward through the same name-matching
pass and widens the async surface on each regeneration.

Raised by review on #5823 (golden regen) and deliberately left out of scope
there — #5823 is a pure snapshot refresh, and this is #5814's documented
tradeoff, not a regression it introduced.

## Acceptance criteria

- Async resolution consults something beyond the bare callee name before
  emitting `await` — at minimum, suppress `await` when the receiver is a
  known-native literal/collection (array literal, string literal, a local
  bound to one, a frozen constant like `INVALID_METHODS_FOR_DELETE_ALL`).
- The six call sites listed above lose their `await` in the regenerated
  goldens; methods that become async _only_ because of such a call site lose
  their `async`.
- No genuinely DB-backed call site loses its `await`.
- `pnpm vitest run scripts/prism-codegen/golden.test.ts` passes with the
  regenerated snapshots, and the 0-parse-errors invariant still holds.

## Definition of done

Manifest change + regenerated goldens land in one PR; the golden diff is
reviewed to confirm every dropped `await` is a native receiver.

## Verification

`pnpm codegen:snapshot` then inspect the diff; `pnpm vitest run
scripts/prism-codegen/golden.test.ts`.
