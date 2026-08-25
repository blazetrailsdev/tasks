---
title: "codegen-async-block-arrows"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5827
claim: "2026-08-01T21:05:30Z"
assignee: "codegen-async-block-arrows"
blocked-by: null
closed-reason: null
---

## Context

`emitCall` in `scripts/prism-codegen/handlers/expressions.ts` wraps a call in
`await` whenever `shouldAwaitCall` (`scripts/prism-codegen/await-policy.ts`)
says yes and `e.inAsyncMethod` is set. `inAsyncMethod` is a property of the
enclosing **def**, not of the function the call actually lands in, so a call
inside a Ruby block emits `await` into an arrow that is never marked `async`.

The arrows are built by `blockToArrow` / `symToProcArrow` in the same file, and
by the `.each`/`.collect` block paths — none of them pass an async modifier.

Live in the checked-in goldens:

- `__snapshots__/persistence.js.snap` — `attributes.collect(attr => await this.create(attr, block))`
  inside `create` and `createBang`
- `__snapshots__/relation.js.snap` — `createOrFindBy`, `createOrFindByBang`,
  and `execQueries`' `skipQueryCacheIfNecessary(() => { ... await this.preloadAssociations(records) ... })`

Each is invalid JS: `await` in a non-async arrow. It parses today only because
the goldens are printed through the TS factory rather than re-parsed, so the
0-parse-errors invariant does not catch it.

Surfaced twice in review on #5826, deliberately left out of scope there (that
PR is the `async`-keyword cleanup and does not touch call emission).

Second-order effect, also from #5826: `containsAwait` in
`handlers/structure.ts` stops at function boundaries, which is the correct
scoping — but it means these five defs emit as non-async functions wrapping a
non-async arrow that awaits. Closing this gap makes that shape well-formed.

## Acceptance criteria

- A block arrow whose emitted body contains an `await` is emitted `async`.
- The five call sites above become valid JS: `attr => await this.create(...)`
  emits as `async attr => await this.create(...)`, and likewise for the
  `execQueries` closure.
- Whether the _enclosing_ def stays `async` is decided independently by
  `containsAwait`, which already ignores nested functions — no def should gain
  or lose `async` from this change alone.
- Goldens regenerated; `pnpm vitest run scripts/prism-codegen/golden.test.ts`
  passes and the 0-parse-errors invariant still holds.

## Verification

`pnpm codegen:snapshot`, then inspect the diff for arrows that gained `async`
and confirm no `await` remains inside a non-async function in any snapshot.
