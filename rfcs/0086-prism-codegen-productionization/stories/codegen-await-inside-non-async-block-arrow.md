---
title: "Await emitted inside a non-async block arrow is invalid JS"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5835
claim: "2026-08-01T23:01:01Z"
assignee: "codegen-await-inside-non-async-block-arrow"
blocked-by: null
closed-reason: null
---

## Context

`scripts/prism-codegen/__snapshots__/persistence.js.snap:245-256` emits
`return await this.save();` inside the synchronous arrow passed to
`this.withTransactionReturningStatus(() => { ... })`, and the enclosing
`export function update(attributes)` is not `async` either. That is invalid
JS: `await` outside an async function.

PR #5831 (paren-less self-calls now emit calls when the port index says the
name is a method) made this shape reachable — `save`/`saveBang` previously
emitted as bare property reads and so never reached `shouldAwaitCall`. The
block-arrow gap itself is older; the story `codegen-async-block-arrows` is
already closed, so this residue needs its own entry.

The arrow is built in `blockToArrow` (`scripts/prism-codegen/handlers/expressions.ts`)
with no async modifier, and the enclosing def's async keyword is decided in
`scripts/prism-codegen/handlers/structure.ts` without looking inside block
bodies.

## Acceptance criteria

- A block arrow whose emitted body contains an `await` is marked `async`.
- The enclosing def's async-keyword decision accounts for awaits emitted
  inside block bodies, or the await is not emitted there at all.
- `persistence.js.snap`'s `update` / `updateBang` images are valid JS.
- Goldens regenerated; `pnpm codegen:score` matched count does not regress.
